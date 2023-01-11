import * as cyfs from 'cyfs-sdk';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { toNONObjectInfo } from '../../common/cyfs_helper/kits';
import { ResponseObject } from '../../common/objs/response_object';
import { PublishMessageReqRequestParam } from '../../common/routers';
import { makeCommonResponse } from '../util';

export async function publishMessageReqRouter(
    req: cyfs.RouterHandlerPostObjectRequest
): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
    const stack = checkStack().check();
    const owner = stack.local_device().desc().owner()!;
    console.log(`current target -----> ${req.request.common.target?.to_base_58()}`);

    // Only allow cross-zone request
    if (!owner.equals(req.request.common.target!)) {
        console.log(`should transfer to -> ${req.request.common.target}`);
        return cyfs.Ok({
            action: cyfs.RouterHandlerAction.Pass
        });
    }

    // Parse out the request object and determine whether the request object is an Message object
    const { object, object_raw } = req.request.object;
    if (!object || object.obj_type() !== AppObjectType.MESSAGE) {
        const errMsg = 'object not exist or object not exist or obj_type err.';
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.InvalidParam, errMsg);
    }

    // Use OrderDecoder to decode the Message object
    const decoder = new MessageDecoder();
    const dr = decoder.from_raw(object_raw);
    if (dr.err) {
        const errMsg = `decode failed, ${dr}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const messageObject: PublishMessageReqRequestParam = dr.unwrap();

    // Create pathOpEnv to perform transaction operations on objects on RootState
    const r = await stack.root_state_stub().create_path_op_env();
    if (r.err) {
        const errMsg = `create_path_op_env failed, ${r}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    const pathOpEnv = r.unwrap();

    // Determine the path where the new Message object will be stored and lock the path
    const createMessagePath = `/messages_list/${messageObject.key}`;
    const paths = [createMessagePath];
    console.log(`will lock paths ${JSON.stringify(paths)}`);
    const lockR = await pathOpEnv.lock(paths, cyfs.JSBI.BigInt(30000));
    if (lockR.err) {
        const errMsg = `lock failed, ${lockR}`;
        console.error(errMsg);
        await pathOpEnv.abort();
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    console.log(`lock ${JSON.stringify(paths)} success.`);

    // Use the Message object information to create the corresponding NONObjectInfo object, and add the NONObjectInfo object to the RootState through the put_object operation
    const decId = stack.dec_id!;
    const nonObj = new cyfs.NONObjectInfo(
        messageObject.desc().object_id(),
        messageObject.encode_to_buf().unwrap()
    );
    const putR = await stack.non_service().put_object({
        common: {
            dec_id: decId,
            level: cyfs.NONAPILevel.NOC, // Local operation only, no network operation will be initiated
            flags: 0
        },
        object: nonObj
    });
    if (putR.err) {
        await pathOpEnv.abort();
        const errMsg = `commit put-object failed, ${putR}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // Use the object_id of NONObjectInfo for the transaction operation of creating a new Message object
    const objectId = nonObj.object_id;
    const rp = await pathOpEnv.insert_with_path(createMessagePath, objectId);
    if (rp.err) {
        await pathOpEnv.abort();
        const errMsg = `commit insert_with_path(${createMessagePath}, ${objectId}), ${rp}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }

    // transaction commit
    const ret = await pathOpEnv.commit();
    if (ret.err) {
        const errMsg = `commit failed, ${ret}.`;
        console.error(errMsg);
        return makeCommonResponse(cyfs.BuckyErrorCode.Failed, errMsg);
    }
    // Transaction operation succeeded
    console.log('publish new message success.');

    // Create a ResponseObject object as a response parameter and send the result to the front end
    return makeCommonResponse();
}
