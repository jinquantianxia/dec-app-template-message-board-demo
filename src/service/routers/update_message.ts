import * as cyfs from 'cyfs-sdk';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { UpdateMessageResponseParam, ROUTER_PATHS } from '../../common/routers';
import { ResponseObject, ResponseObjectDecoder } from '../../common/objs/response_object';
import { toNONObjectInfo, makeBuckyErr } from '../../common/cyfs_helper/kits';
import { getFriendPeopleId } from '../util';

export async function updateMessageRouter(
    req: cyfs.RouterHandlerPostObjectRequest
): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
    // Parse out the request object and determine whether the request object is an Message object
    const { object, object_raw } = req.request.object;
    if (!object || object.obj_type() !== AppObjectType.MESSAGE) {
        const msg = 'obj_type err.';
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }

    // Use MessageDecoder to decode the Message object
    const decoder = new MessageDecoder();
    const r = decoder.from_raw(object_raw);
    if (r.err) {
        const msg = `decode failed, ${r}.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }
    const MessageObject = r.unwrap();

    // Create pathOpEnv to perform transaction operations on objects on RootState
    const stack = checkStack().check();
    let createRet = await stack.root_state_stub().create_path_op_env();
    if (createRet.err) {
        const msg = `create_path_op_env failed, ${createRet}.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InternalError, msg));
    }
    const pathOpEnv = createRet.unwrap();

    // Determine the storage path of the Message object to be updated and lock the path
    const queryMessagePath = `/messages_list/${MessageObject.key}`;
    const paths = [queryMessagePath];
    console.log(`will lock paths ${JSON.stringify(paths)}`);
    const lockR = await pathOpEnv.lock(paths, cyfs.JSBI.BigInt(30000));
    if (lockR.err) {
        const errMsg = `lock failed, ${lockR}`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Locked successfully
    console.log(`lock ${JSON.stringify(paths)} success.`);

    // Use the get_by_path method of pathOpEnv to get the object_id of the old Message object from the storage path of the old Message object
    const idR = await pathOpEnv.get_by_path(queryMessagePath);
    if (idR.err) {
        const errMsg = `get_by_path (${queryMessagePath}) failed, ${idR}`;
        await pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }
    const oldObjectId = idR.unwrap();
    if (!oldObjectId) {
        const errMsg = `unwrap failed after get_by_path (${queryMessagePath}) failed, ${idR}`;
        await pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Use the new Message object information to create the corresponding NONObjectInfo object, and update the NONObjectInfo object to RootState through the put_object operation
    const nonObj = new cyfs.NONObjectInfo(
        MessageObject.desc().object_id(),
        MessageObject.encode_to_buf().unwrap()
    );
    const decId = stack.dec_id!;
    const putR = await stack.non_service().put_object({
        common: {
            dec_id: decId,
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object: nonObj
    });
    if (putR.err) {
        console.error(`commit put-object failed, ${putR}.`);
        await pathOpEnv.abort();
        return putR;
    }

    // Using pathOpEnv, the transaction operation of replacing the old Message object with the object_id of the NONObjectInfo object of the new Message object
    const newObjectId = nonObj.object_id;
    const rs = await pathOpEnv.set_with_path(queryMessagePath, newObjectId!, oldObjectId, true);
    console.log(
        `set_with_path(${queryMessagePath}, ${newObjectId!.to_base_58()}, ${oldObjectId.to_base_58()}, true), ${rs}`
    );
    if (rs.err) {
        console.error(
            `commit set_with_path(${queryMessagePath},${newObjectId},${oldObjectId}), ${rs}.`
        );
        await pathOpEnv.abort();
        return rs;
    }
    // transaction commit
    const ret = await pathOpEnv.commit();
    if (ret.err) {
        const errMsg = `commit failed, ${ret}`;
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Transaction operation succeeded
    console.log('publish new message success.');

    // Cross-zone notification, notify the specified user OOD
    const stackWraper = checkStack();
    const peopleId = getFriendPeopleId();
    await stackWraper.postObject(MessageObject, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.UPDATE_MESSAGE_REQ,
        decId: stack.dec_id!,
        target: cyfs.PeopleId.from_base_58(peopleId).unwrap().object_id // Here is the difference between the same zone and cross zone.
    });

    // Create a ResponseObject object as a response parameter and send the result to the front end
    const respObj: UpdateMessageResponseParam = ResponseObject.create({
        err: 0,
        msg: 'ok',
        decId: stack.dec_id!,
        owner: checkStack().checkOwner()
    });
    return Promise.resolve(
        cyfs.Ok({
            action: cyfs.RouterHandlerAction.Response,
            response: cyfs.Ok({
                object: toNONObjectInfo(respObj)
            })
        })
    );
}
