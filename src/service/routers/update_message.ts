import * as cyfs from 'cyfs-sdk';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { ROUTER_PATHS, UpdateMessageRequestParam } from '../../common/routers';
import { ResponseObjectDecoder } from '../../common/objs/response_object';
import { getFriendPeopleIds, makeCommonResponse } from '../util';

export async function updateMessageRouter(
    req: cyfs.RouterHandlerPostObjectRequest
): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
    // Parse out the request object and determine whether the request object is an Message object
    const { object, object_raw } = req.request.object;
    if (!object || object.obj_type() !== AppObjectType.MESSAGE) {
        const errMsg = 'object not exist or obj_type err.';
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.InvalidParam, errMsg);
    }

    // Use MessageDecoder to decode the Message object
    const decoder = new MessageDecoder();
    const r = decoder.from_raw(object_raw);
    if (r.err) {
        const errMsg = `decode failed, ${r}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const messageObject: UpdateMessageRequestParam = r.unwrap();

    // Create pathOpEnv to perform transaction operations on objects on RootState
    const stack = checkStack().check();
    let createRet = await stack.root_state_stub().create_path_op_env();
    if (createRet.err) {
        const errMsg = `create_path_op_env failed, ${createRet}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const pathOpEnv = createRet.unwrap();

    // Determine the storage path of the Message object to be updated and lock the path
    const queryMessagePath = `/messages_list/${messageObject.key}`;
    const paths = [queryMessagePath];
    console.log(`will lock paths ${JSON.stringify(paths)}`);
    const lockR = await pathOpEnv.lock(paths, cyfs.JSBI.BigInt(30000));
    if (lockR.err) {
        const errMsg = `lock failed, ${lockR}`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // Locked successfully
    console.log(`lock ${JSON.stringify(paths)} success.`);

    // Use the new Message object information to create the corresponding NONObjectInfo object, and update the NONObjectInfo object to RootState through the put_object operation
    const nonObj = new cyfs.NONObjectInfo(
        messageObject.desc().object_id(),
        messageObject.encode_to_buf().unwrap()
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
        const errMsg = `commit put-object failed, ${putR}.`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // Using pathOpEnv, the transaction operation of replacing the old Message object with the object_id of the NONObjectInfo object of the new Message object
    const newObjectId = nonObj.object_id;
    const rs = await pathOpEnv.set_with_path(queryMessagePath, newObjectId!);
    console.log(`set_with_path(${queryMessagePath}, ${newObjectId!.to_base_58()}, }, true), ${rs}`);
    if (rs.err) {
        const errMsg = `commit set_with_path(${queryMessagePath},${newObjectId}), ${rs}.`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    // transaction commit
    const ret = await pathOpEnv.commit();
    if (ret.err) {
        const errMsg = `commit failed, ${ret}`;
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // Transaction operation succeeded
    console.log('update message success.');

    // Cross-zone notification, notify the specified user OOD
    // const stackWraper = checkStack();
    // const peopleIds = getFriendPeopleIds();
    // await Promise.all(
    //     peopleIds.map(async (peopleId) => {
    //         return await stackWraper.postObject(messageObject, ResponseObjectDecoder, {
    //             reqPath: ROUTER_PATHS.UPDATE_MESSAGE_REQ,
    //             decId: stack.dec_id!,
    //             target: cyfs.PeopleId.from_base_58(peopleId).unwrap().object_id // Here is the difference between the same zone and cross zone.
    //         });
    //     })
    // );

    // Create a ResponseObject object as a response parameter and send the result to the front end
    return makeCommonResponse();
}
