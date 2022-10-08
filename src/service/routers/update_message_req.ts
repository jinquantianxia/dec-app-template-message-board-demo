import * as cyfs from 'cyfs-sdk';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { UpdateMessageResponseParam } from '../../common/routers';
import { ResponseObject } from '../../common/objs/response_object';
import { toNONObjectInfo, makeBuckyErr } from '../../common/cyfs_helper/kits';
import { getFriendPeopleId } from '../util';

export async function updateMessageReqRouter(
    req: cyfs.RouterHandlerPostObjectRequest
): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
    const stack = checkStack().check();
    const owner = stack.local_device().desc().owner()!.unwrap();
    console.log(`current target -----> ${req.request.common.target?.to_base_58()}`);

    // Only allow cross-zone request
    if (!owner.equals(req.request.common.target!)) {
        console.log(`should transfer to -> ${req.request.common.target}`);
        return Promise.resolve(
            cyfs.Ok({
                action: cyfs.RouterHandlerAction.Pass
            })
        );
    }
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
        pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Locked successfully
    console.log(`lock ${JSON.stringify(paths)} success.`);

    // Use the get_by_path method of pathOpEnv to get the object_id of the old Message object from the storage path of the old Message object
    const idR = await pathOpEnv.get_by_path(queryMessagePath);
    if (idR.err) {
        const errMsg = `get_by_path (${queryMessagePath}) failed, ${idR}`;
        console.error(errMsg);
        pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }
    const id = idR.unwrap();
    if (!id) {
        const errMsg = `unwrap failed after get_by_path (${queryMessagePath}) failed, ${idR}`;
        console.error(errMsg);
        pathOpEnv.abort();
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
        pathOpEnv.abort();
        return putR;
    }

    // Using pathOpEnv, the transaction operation of replacing the old Message object with the object_id of the NONObjectInfo object of the new Message object
    const objectId = nonObj.object_id;
    const rs = await pathOpEnv.set_with_path(queryMessagePath, objectId!, id, true);
    console.log(
        `set_with_path(${queryMessagePath}, ${objectId!.to_base_58()}, ${id.to_base_58()}, true), ${rs}`
    );
    if (rs.err) {
        console.error(`commit set_with_path(${queryMessagePath},${objectId},${id}), ${rs}.`);
        pathOpEnv.abort();
        return rs;
    }
    // transaction commit
    const ret = await pathOpEnv.commit();
    if (ret.err) {
        const errMsg = `commit failed, ${ret}`;
        console.error(errMsg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Transaction operation succeeded
    console.log('publish new message success.');

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
