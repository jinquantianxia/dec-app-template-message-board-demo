// message apis

import * as cyfs from 'cyfs-sdk';
import { checkStack } from '@src/common/cyfs_helper/stack_wraper';
import { ROUTER_PATHS } from '@src/common/routers';
import { Message, MessageDecoder } from '@src/common/objs/message_object';
import { ResponseObjectDecoder } from '@src/common/objs/response_object';
import { DEC_ID } from '../../common/constant';
import { MessageItem, MessageType } from '@www/types/common';
import { generateUniqueKey } from '@www/utils/common';

// publish message
export async function publishMessage(content: string) {
    const stackWraper = checkStack();
    // Create a new Message object
    const messageObj = Message.create({
        key: generateUniqueKey(),
        content,
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(messageObj, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.PUBLISH_MESSAGE,
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
            err: r.errCode,
            msg: r.msg
        };
        console.log(`reponse, ${retObj}`);
        return JSON.stringify(retObj);
    }
    return null;
}

// delete Message
export async function deleteMessage(msgKey: string) {
    const stackWraper = checkStack();
    // Create a delete Message object
    const MessageObj = Message.create({
        key: msgKey,
        content: '',
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(MessageObj, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.DELETE_MESSAGE,
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
            err: r.errCode,
            msg: r.msg
        };
        console.log(`reponse, ${retObj}`);
        return JSON.stringify(retObj);
    }
    return null;
}

// update Message
export async function updateMessage(msgKey: string, content: string) {
    const stackWraper = checkStack();
    // Create a delete Message object
    const MessageObj = Message.create({
        key: msgKey,
        content,
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(MessageObj, ResponseObjectDecoder, {
        reqPath: ROUTER_PATHS.UPDATE_MESSAGE,
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
            err: r.errCode,
            msg: r.msg
        };
        console.log(`reponse, ${retObj}`);
        return JSON.stringify(retObj);
    }
    return null;
}

// retrieve message
export async function retrieveMessage(msgKey: string, target?: cyfs.ObjectId) {
    const stackWraper = checkStack();
    // Create a new Message object
    const messageObj = Message.create({
        key: msgKey,
        content: '',
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(messageObj, MessageDecoder, {
        reqPath: ROUTER_PATHS.RETRIEVE_MESSAGE,
        decId: DEC_ID,
        target
    });
    if (ret.err) {
        console.error(`reponse err, ${ret}`);
        return null;
    }
    // Parse out the MessageObject object
    const msgRawObj = ret.unwrap();
    if (msgRawObj) {
        const msgObj: MessageItem = {
            key: msgRawObj.key,
            name: msgRawObj.desc().owner()!.to_base_58(),
            time: cyfs.bucky_time_2_js_time(msgRawObj.desc().create_time()),
            content: msgRawObj.content,
            isSelf: msgRawObj.desc().owner()!.equals(checkStack().checkOwner())
        };
        return msgObj;
    }
    return null;
}

// paging list messages under path /messages_list
export async function listMessagesByPage(pageIndex: number, to?: cyfs.ObjectId) {
    const stack = checkStack();
    // Get your own OwnerId
    const target = to ? to : stack.checkOwner();
    // const selfObjectId = stack.checkOwner();
    // Get an instance of cyfs.GlobalStateAccessStub
    const access = stack.check().root_state_accessor_stub(target);
    // Use the list method to list all objects under messages_list
    const lr = await access.list('/messages_list', pageIndex, 10);

    if (lr.err) {
        if (lr.val.code !== cyfs.BuckyErrorCode.NotFound) {
            console.error(`list-subdirs in(messages_list) io failed, ${lr}`);
        } else {
            console.warn(`list-subdirs in(messages_list) not found, ${lr}`);
        }
        return [];
    }

    const list = lr.unwrap();
    const keyList = list.map((item) => item.map!.key);
    console.log('keyList: ', keyList);
    const msgList = await Promise.all(
        keyList.map(async (item) => {
            const msg = await retrieveMessage(item, target);
            return msg;
        })
    );
    const retList = msgList.filter((msg) => msg !== null) as MessageItem[];
    retList.sort((a, b) => b.time - a.time);
    return retList;
}

/**
 * use non_service retrieve message object directly
 * you should change listMessagesByPage const keyList = list.map((item) => item.map!.key) to  item.map!.value
 */

// export async function retrieveMessage(objectId: cyfs.ObjectId) {
//     const stack = checkStack().check();
//     const gr = await stack.non_service().get_object({
//         common: { level: cyfs.NONAPILevel.Router, flags: 0 },
//         object_id: objectId
//     });
//     if (gr.err) {
//         const errMsg = `get_object from non_service failed, objectId(${objectId.to_base_58()})`;
//         console.error(errMsg);
//         return null;
//     }
//     const msgResult = gr.unwrap().object.object_raw;
//     const decoder = new MessageDecoder();
//     const rm = decoder.from_raw(msgResult);
//     if (rm.err) {
//         const msg = `decode failed, ${rm}.`;
//         console.error(msg);
//         return null;
//     }
//     const msgRawObj = rm.unwrap();
//     const msgObj: MessageItem = {
//         key: msgRawObj.key,
//         name: msgRawObj.desc().owner()!.unwrap().to_base_58(),
//         time: cyfs.bucky_time_2_js_time(msgRawObj.desc().create_time()),
//         content: msgRawObj.content,
//         isSelf: msgRawObj.desc().owner()!.unwrap().equals(checkStack().checkOwner())
//     };
//     return msgObj;
// }
