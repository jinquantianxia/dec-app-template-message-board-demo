// demo apis

import * as cyfs from 'cyfs-sdk';
import { checkStack } from '@src/common/cyfs_helper/stack_wraper';
import { ROUTER_PATHS } from '@src/common/routers';
import { Message, MessageDecoder } from '@src/common/objs/message_object';
import { Comment, CommentDecoder } from '@src/common/objs/comment_object';
import { ResponseObject, ResponseObjectDecoder } from '@src/common/objs/response_object';
import { DEC_ID } from '../../common/constant';
import { CommentType, CommentItem } from '@www/types/common';

// publish comment
export async function publishComment(msgId: cyfs.ObjectId, content: string) {
    const stackWraper = checkStack();
    // Create an Message object
    const commentObj = Comment.create({
        msgId,
        type: CommentType.NEW,
        content,
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(commentObj, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.PUBLISH_COMMENT,
        decId: DEC_ID
    });
    if (ret.err) {
        console.error(`reponse err, ${ret}`);
        return null;
    }
    // Parse out the ResponseObject object
    const r = ret.unwrap();
    if (r) {
        const retObj = {
            err: r.err,
            msg: r.msg
        };
        console.log(`reponse, ${retObj}`);
        return JSON.stringify(retObj);
    }
    return null;
}

// delete comment
export async function deleteComment(comment: CommentItem) {
    const stackWraper = checkStack();
    // Create an Message object
    const commentObj = Comment.create({
        msgId: cyfs.ObjectId.from_base_58(comment.msgId).unwrap(),
        type: CommentType.DELETE,
        content: '',
        ref: cyfs.ObjectId.from_base_58(comment.id).unwrap(),
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(commentObj, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.DELETE_COMMENT,
        decId: DEC_ID
    });
    if (ret.err) {
        console.error(`reponse err, ${ret}`);
        return null;
    }
    // Parse out the ResponseObject object
    const r = ret.unwrap();
    if (r) {
        const retObj = {
            err: r.err,
            msg: r.msg
        };
        console.log(`reponse, ${retObj}`);
        return JSON.stringify(retObj);
    }
    return null;
}

// retrieve comment
export async function retrieveComment(objectId: cyfs.ObjectId) {
    const stack = checkStack().check();
    const gr = await stack.non_service().get_object({
        common: { level: cyfs.NONAPILevel.Router, flags: 0 },
        object_id: objectId
    });
    if (gr.err) {
        const errMsg = `get_object from non_service failed, objectId(${objectId.to_base_58()})`;
        console.error(errMsg);
        return null;
    }
    const msgResult = gr.unwrap().object.object_raw;
    const decoder = new CommentDecoder();
    const rm = decoder.from_raw(msgResult);
    if (rm.err) {
        const msg = `decode failed, ${rm}.`;
        console.error(msg);
        return null;
    }
    const commentRawObj = rm.unwrap();
    const commentObj: CommentItem = {
        id: commentRawObj.desc().object_id().to_base_58(),
        msgId: commentRawObj.msgId.to_base_58(),
        name: commentRawObj.desc().owner()!.unwrap().to_base_58(),
        time: cyfs.bucky_time_2_js_time(commentRawObj.desc().create_time()),
        type: commentRawObj.type,
        content: commentRawObj.content,
        isDeleted: false,
        isSelf: commentRawObj.desc().owner()!.unwrap().equals(checkStack().checkOwner()),
        ref: commentRawObj.ref?.to_base_58()
    };
    return commentObj;
}

// paging list comments under path /comments_list/messageId
export async function listCommentsByPage(messageId: string, pageIndex: number) {
    const stack = checkStack();
    // Get your own OwnerId
    const selfObjectId = stack.checkOwner();
    // Get an instance of cyfs.GlobalStateAccessStub
    const access = stack.check().root_state_access_stub(selfObjectId);
    // Use the list method to list all objects under /messages
    const lr = await access.list(`/comments_list/${messageId}`, pageIndex, 10);

    if (lr.err) {
        if (lr.val.code !== cyfs.BuckyErrorCode.NotFound) {
            console.error(`list-subdirs in(/messages) io failed, ${lr}`);
        } else {
            console.warn(`list-subdirs in(/messages) not found, ${lr}`);
        }
        return [];
    }

    const list = lr.unwrap();
    const keyList = list.map((item) => item.map!.key);
    const msgList = await Promise.all(
        keyList.map(async (item) => {
            const msg = await retrieveComment(cyfs.ObjectId.from_base_58(item).unwrap());
            return msg;
        })
    );
    const checkList: string[] = [];
    const retList: CommentItem[] = [];
    const commentList = msgList.filter((msg) => msg !== null) as CommentItem[];
    commentList.forEach((comment) => {
        if (comment.ref) {
            checkList.push(comment.ref);
        } else {
            retList.push(comment);
        }
    });
    retList.forEach((comment) => {
        if (checkList.includes(comment.id)) {
            comment.isDeleted = true;
        }
    });
    retList.sort((a, b) => a.time - b.time);
    return retList;
}
