import * as cyfs from 'cyfs-sdk';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { DeleteMessageReqRequestParam } from '../../common/routers';
import { getFriendPeopleId, makeCommonResponse } from '../util';

export async function deleteMessageReqRouter(
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
        const msg = 'object not exist or obj_type err.';
        console.error(msg);
        return makeCommonResponse(cyfs.BuckyErrorCode.InvalidParam, msg);
    }

    // Use MessageDecoder to decode the Message object
    const decoder = new MessageDecoder();
    const r = decoder.from_raw(object_raw);
    if (r.err) {
        const errMsg = `decode failed, ${r}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const messageObject: DeleteMessageReqRequestParam = r.unwrap();

    // Create pathOpEnv to perform transaction operations on objects on RootState
    let createRet = await stack.root_state_stub().create_path_op_env();
    if (createRet.err) {
        const errMsg = `create_path_op_env failed, ${createRet}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const pathOpEnv = createRet.unwrap();

    // Determine the storage path of the Message object to be deleted and lock the path
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

    // Use the get_by_path method of pathOpEnv to get the object_id of the Message object from the storage path of the Message object
    const idR = await pathOpEnv.get_by_path(queryMessagePath);
    if (idR.err) {
        const errMsg = `get_by_path (${queryMessagePath}) failed, ${idR}`;
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const objectId = idR.unwrap();
    if (!objectId) {
        const errMsg = `unwrap failed after get_by_path (${queryMessagePath}) failed, ${idR}`;
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // Use the remove_with_path method of pathOpEnv to pass in the object_id of the Message object to be deleted for the transaction operation of deleting the Message object
    const rm = await pathOpEnv.remove_with_path(queryMessagePath, objectId);
    console.log(`remove_with_path(${queryMessagePath}, ${objectId.to_base_58()}), ${rm}`);
    if (rm.err) {
        const errMsg = `commit remove_with_path(${queryMessagePath}, ${objectId}), ${rm}.`;
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
    console.log('delete Message success.');

    // Create a ResponseObject object as a response parameter and send the result to the front end
    return makeCommonResponse();
}
