import * as cyfs from 'cyfs-sdk';
import { CommentDecoder } from '../../common/objs/comment_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { toNONObjectInfo } from '../../common/cyfs_helper/kits';
import { ResponseObject } from '../../common/objs/response_object';
import { PublishCommentReqResponseParam } from '../../common/routers';

export async function publishCommentReqRouter(
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

    // Parse out the request object and determine whether the request object is an Comment object
    const { object, object_raw } = req.request.object;
    if (!object || object.obj_type() !== AppObjectType.COMMENT) {
        const msg = 'obj_type err.';
        console.error(msg);
        return Promise.resolve(
            cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.InvalidParam, msg))
        );
    }
    // Use OrderDecoder to decode the Comment object
    const decoder = new CommentDecoder();
    const dr = decoder.from_raw(object_raw);
    if (dr.err) {
        const msg = `decode failed, ${dr}.`;
        console.error(msg);
        return dr;
    }
    const commentObject = dr.unwrap();

    // Create pathOpEnv to perform transaction operations on objects on RootState
    const r = await stack.root_state_stub().create_path_op_env();
    if (r.err) {
        const msg = `create_path_op_env failed, ${r}.`;
        console.error(msg);
        return r;
    }
    const pathOpEnv = r.unwrap();

    // Determine the path where the new Comment object will be stored and lock the path
    const commentKey = commentObject.desc().object_id().to_base_58();
    const msgObejctId = commentObject.msgId.to_base_58();
    const commentPath = `/comments_list/${msgObejctId}/${commentKey}`;
    const paths = [commentPath];
    console.log(`will lock paths ${JSON.stringify(paths)}`);
    const lockR = await pathOpEnv.lock(paths, cyfs.JSBI.BigInt(30000));
    if (lockR.err) {
        const errMsg = `lock failed, ${lockR}`;
        console.error(errMsg);
        pathOpEnv.abort();
        return Promise.resolve(cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.Failed, errMsg)));
    }

    // Locked successfully
    console.log(`lock ${JSON.stringify(paths)} success.`);

    // Use the Comment object information to create the corresponding NONObjectInfo object, and add the NONObjectInfo object to the RootState through the put_object operation
    const decId = stack.dec_id!;
    const nonObj = new cyfs.NONObjectInfo(
        commentObject.desc().object_id(),
        commentObject.encode_to_buf().unwrap()
    );
    const putR = await stack.non_service().put_object({
        common: {
            dec_id: decId,
            level: cyfs.NONAPILevel.NOC,
            flags: 0
        },
        object: nonObj
    });
    if (putR.err) {
        pathOpEnv.abort();
        const errMsg = `commit put-object failed, ${putR}.`;
        console.error(errMsg);
        return Promise.resolve(cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.Failed, errMsg)));
    }

    // Use the object_id of NONObjectInfo for the transaction operation of creating a new Comment object
    const objectId = nonObj.object_id;
    const rp = await pathOpEnv.insert_with_path(commentPath, objectId);
    if (rp.err) {
        pathOpEnv.abort();
        const errMsg = `commit insert_with_path(${commentPath}, ${objectId}), ${rp}.`;
        console.error(errMsg);
        return Promise.resolve(cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.Failed, errMsg)));
    }

    // transaction commit
    const ret = await pathOpEnv.commit();
    if (ret.err) {
        const errMsg = `commit failed, ${ret}.`;
        console.error(errMsg);
        return Promise.resolve(cyfs.Err(new cyfs.BuckyError(cyfs.BuckyErrorCode.Failed, errMsg)));
    }

    // Transaction operation succeeded
    console.log('publish new comment success.');

    // Create a ResponseObject object as a response parameter and respond back with the result
    const respObj: PublishCommentReqResponseParam = ResponseObject.create({
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
