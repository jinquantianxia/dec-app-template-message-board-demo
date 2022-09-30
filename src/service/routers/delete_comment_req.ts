import * as cyfs from 'cyfs-sdk';
import { CommentDecoder } from '../../common/objs/comment_object';
import { MessageDecoder } from '../../common/objs/message_object';
import { checkStack } from '../../common/cyfs_helper/stack_wraper';
import { AppObjectType } from '../../common/types';
import { DeleteCommentResponseParam } from '../../common/routers';
import { ResponseObject } from '../../common/objs/response_object';
import { toNONObjectInfo, makeBuckyErr } from '../../common/cyfs_helper/kits';
import { ResponseObjectDecoder } from '../../common/objs/response_object';
import { ROUTER_PATHS, PublishCommentResponseParam } from '../../common/routers';

export async function DeleteCommentReqRouter(
    req: cyfs.RouterHandlerPostObjectRequest
): Promise<cyfs.BuckyResult<cyfs.RouterHandlerPostObjectResult>> {
    const stack = checkStack().check();
    const owner = stack.local_device().desc().owner()!.unwrap();
    console.log(`current target -----> ${req.request.common.target?.to_base_58()}`);
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
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }

    // Use CommentDecoder to decode the Comment object
    const decoder = new CommentDecoder();
    const r = decoder.from_raw(object_raw);
    if (r.err) {
        const msg = `decode failed, ${r}.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }
    const commentObject = r.unwrap();
    const isDeleteComment = commentObject.type === 1;
    if (!isDeleteComment) {
        const msg = `current commentObject type is not delete, object_id -> ${commentObject
            .desc()
            .object_id()
            .to_base_58()}.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }
    const deleteCommentId = commentObject.ref;
    if (!deleteCommentId) {
        const msg = `Lack of ref property in current commentObject, ${commentObject
            .desc()
            .object_id()
            .to_base_58()}.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }

    // Create pathOpEnv to perform transaction operations on objects on RootState
    let createRet = await stack.root_state_stub().create_path_op_env();
    if (createRet.err) {
        const msg = `create_path_op_env failed, ${createRet}.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InternalError, msg));
    }
    const pathOpEnv = createRet.unwrap();

    const msgId = commentObject.msgId.to_base_58();
    const commentId = commentObject.desc().object_id().to_base_58();
    const queryDeleteCommentPath = `/comments_list/${msgId}/${deleteCommentId}`;
    const commentPath = `/comments_list/${msgId}/${commentId}`;
    const paths = [queryDeleteCommentPath, commentPath];
    console.log(`will lock paths ${JSON.stringify(paths)}`);
    const lockRetrieve = await pathOpEnv.lock(paths, cyfs.JSBI.BigInt(30000));
    if (lockRetrieve.err) {
        const errMsg = `lock failed, ${lockRetrieve}`;
        console.error(errMsg);
        pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Locked retrieve message successfully
    console.log(`lock ${JSON.stringify(paths)} success.`);

    // Use the get_by_path method of pathOpEnv to get the object_id of the Comment object from the storage path of the Comment object
    const idRetrieve = await pathOpEnv.get_by_path(queryDeleteCommentPath);
    if (idRetrieve.err) {
        const errMsg = `get_by_path (${queryDeleteCommentPath}) failed, ${idRetrieve}`;
        pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }
    const retrieveObjectId = idRetrieve.unwrap();
    if (!retrieveObjectId) {
        const errMsg = `objectId not found after get_by_path (${queryDeleteCommentPath})`;
        pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Use the get_object method to obtain the cyfs.NONGetObjectOutputResponse object corresponding to the Comment object from RootState with the object_id of the Comment object as a parameter
    const gr = await stack.non_service().get_object({
        common: { level: cyfs.NONAPILevel.NOC, flags: 0 },
        object_id: retrieveObjectId
    });
    if (gr.err) {
        const errMsg = `get_object from non_service failed, path(${queryDeleteCommentPath}), ${gr}`;
        pathOpEnv.abort();
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // decode the Comment object in Uint8Array format to get the final Comment object
    const commentResult = gr.unwrap().object.object_raw;
    const rc = decoder.from_raw(commentResult);
    if (rc.err) {
        const msg = `decode failed, ${r}.`;
        console.error(msg);
        return Promise.resolve(
            makeBuckyErr(cyfs.BuckyErrorCode.Failed, 'decode Comment obj from raw excepted.')
        );
    }
    const deleteCommentObj = rc.unwrap();
    const deleteCommentOwner = deleteCommentObj.desc().owner()!.unwrap();
    const commentObjectOwner = commentObject.desc().owner()!.unwrap();
    if (!commentObjectOwner.equals(deleteCommentOwner)) {
        // 当前发起删除的Comment对象的Owner与要删除的Comment的Owner不匹配
        const msg = `current comment owner -> ${commentObjectOwner.to_base_58()} mismatch the comment to be deleted -> ${deleteCommentOwner.to_base_58()}, delete failed.`;
        console.error(msg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.InvalidParam, msg));
    }
    const decId = stack.dec_id!;
    const nonObj = new cyfs.NONObjectInfo(
        commentObject.desc().object_id(),
        commentObject.encode_to_buf().unwrap()
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
        pathOpEnv.abort();
        const errMsg = `commit put-object failed, ${putR}.`;
        console.error(errMsg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // Use the object_id of NONObjectInfo for the transaction operation of creating a new Comment object
    const objectId = nonObj.object_id;
    const rp = await pathOpEnv.insert_with_path(commentPath, objectId);
    if (rp.err) {
        pathOpEnv.abort();
        const errMsg = `commit insert_with_path(${commentPath}, ${objectId}), ${rp}.`;
        console.error(errMsg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }

    // transaction commit
    const ret = await pathOpEnv.commit();
    if (ret.err) {
        const errMsg = `commit failed, ${ret}.`;
        console.error(errMsg);
        return Promise.resolve(makeBuckyErr(cyfs.BuckyErrorCode.Failed, errMsg));
    }
    // Transaction operation succeeded
    console.log('publish new comment success.');
    // Cross-zone notification, notify the specified user OOD
    const stackWraper = checkStack();
    // If here is the windows simulator environment, C:\cyfs\etc\zone-simulator\desc_list -> zone2 -> people,
    // If here is the mac simulator environment, /Users/<username>/Library/Application Support/cyfs/etc/zone-simulator/desc_list -> zone2 -> people,
    // otherwise, you should use real poepleId.
    const peopleId = '5r4MYfFVtnu7yAP5XSZGg8JsqZuzyqozH6oXCLMPb8h8';
    await stackWraper.postObject(commentObject, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.DELETE_COMMENT_REQ,
        decId: stack.dec_id!,
        target: cyfs.PeopleId.from_base_58(peopleId).unwrap().object_id // Here is the difference between the same zone and cross zone.
    });
    // Create a ResponseObject object as a response parameter and send the result to the front end
    const respObj: DeleteCommentResponseParam = ResponseObject.create({
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
