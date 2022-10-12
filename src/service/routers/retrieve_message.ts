import * as cyfs from 'cyfs-sdk';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { toNONObjectInfo } from '../../common/cyfs_helper/kits';
import { RetrieveMessageRequestParam } from '../../common/routers';
import { makeCommonResponse } from '../util';

export async function retrieveMessageRouter(
    req: cyfs.RouterHandlerPostObjectRequest
): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
    // Parse out the request object and determine whether the request object is an Message object
    const { object, object_raw } = req.request.object;
    if (!object || object.obj_type() !== AppObjectType.MESSAGE) {
        const errMsg = `object not exist or obj_type err.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.InvalidParam, errMsg);
    }

    // Use MessageDecoder to decode the Message object
    const messageDecoder = new MessageDecoder();
    const dr = messageDecoder.from_raw(object_raw);
    if (dr.err) {
        const errMsg = `decode failed, ${dr}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const messageObject: RetrieveMessageRequestParam = dr.unwrap();

    // Create pathOpEnv to perform transaction operations on objects on RootState
    const stack = checkStack().check();
    const createRet = await stack.root_state_stub().create_path_op_env();
    if (createRet.err) {
        const errMsg = `create_path_op_env failed, ${createRet}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const pathOpEnv = createRet.unwrap();

    // Use the get_by_path method of pathOpEnv to get the object_id of the Message object from the storage path of the Message object
    const queryMessagePath = `/messages_list/${messageObject.key}`;
    const idR = await pathOpEnv.get_by_path(queryMessagePath);
    if (idR.err) {
        const errMsg = `get_by_path (${queryMessagePath}) failed, ${idR}`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const objectId = idR.unwrap();
    if (!objectId) {
        const errMsg = `objectId not found after get_by_path (${queryMessagePath}), ${idR}`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // Use the get_object method to obtain the cyfs.NONGetObjectOutputResponse object corresponding to the Message object from RootState with the object_id of the Message object as a parameter
    const gr = await stack.non_service().get_object({
        common: { level: cyfs.NONAPILevel.NOC, flags: 0 },
        object_id: objectId
    });
    if (gr.err) {
        const errMsg = `get_object from non_service failed, path(${queryMessagePath}), ${idR}`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // After releasing the lock, decode the Message object in Uint8Array format to get the final Message object
    // await pathOpEnv.abort();
    const MessageResult = gr.unwrap().object.object_raw;
    const decoder = new MessageDecoder();
    const r = decoder.from_raw(MessageResult);
    if (r.err) {
        const errMsg = `decode failed, ${r}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const MessageObj = r.unwrap();

    // Return the decoded Message object to the front end
    return cyfs.Ok({
        action: cyfs.RouterHandlerAction.Response,
        response: cyfs.Ok({
            object: toNONObjectInfo(MessageObj)
        })
    });
}
