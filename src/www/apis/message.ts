// message apis

import * as cyfs from 'cyfs-sdk';
import { checkStack } from '@src/common/cyfs_helper/stack_wraper';
import { ROUTER_PATHS } from '@src/common/routers';
import { Message, MessageDecoder } from '@src/common/objs/message_object';
import { ResponseObject, ResponseObjectDecoder } from '@src/common/objs/response_object';
import { DEC_ID } from '../../common/constant';
import { MessageItem } from '@www/types/common';

// publish message
export async function publishMessage(content: string) {
    const stackWraper = checkStack();
    // Create a new Message object
    const messageObj = Message.create({
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
            err: r.err,
            msg: r.msg
        };
        console.log(`reponse, ${retObj}`);
        return JSON.stringify(retObj);
    }
    return null;
}

// retrieve message
export async function retrieveMessage(objectId: cyfs.ObjectId) {
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
    const decoder = new MessageDecoder();
    const rm = decoder.from_raw(msgResult);
    if (rm.err) {
        const msg = `decode failed, ${rm}.`;
        console.error(msg);
        return null;
    }
    const msgRawObj = rm.unwrap();
    const msgObj: MessageItem = {
        id: msgRawObj.desc().object_id().to_base_58(),
        name: msgRawObj.desc().owner()!.unwrap().to_base_58(),
        time: cyfs.bucky_time_2_js_time(msgRawObj.desc().create_time()),
        content: msgRawObj.content,
        isSelf: msgRawObj.desc().owner()!.unwrap().equals(checkStack().checkOwner())
    };
    return msgObj;
}

// paging list messages under path /messages_list
export async function listMessagesByPage(pageIndex: number) {
    const stack = checkStack();
    // Get your own OwnerId
    const selfObjectId = stack.checkOwner();
    // Get an instance of cyfs.GlobalStateAccessStub
    const access = stack.check().root_state_access_stub(selfObjectId);
    // Use the list method to list all objects under /messages
    const lr = await access.list('/messages_list', pageIndex, 10);

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
    console.log('keyList: ', keyList);
    const msgList = await Promise.all(
        keyList.map(async (item) => {
            const msg = await retrieveMessage(cyfs.ObjectId.from_base_58(item).unwrap());
            return msg;
        })
    );
    const retList = msgList.filter((msg) => msg !== null) as MessageItem[];
    retList.sort((a, b) => b.time - a.time);
    return retList;
}
