import {
    checkStack,
    SimulatorDeviceNo,
    SimulatorZoneNo,
    useSimulator,
    waitStackRuntime
} from '../../common/cyfs_helper/stack_wraper';
import * as cyfs from 'cyfs-sdk';
import { DEC_ID } from '../../common/constant';
import { Message, MessageDecoder } from '../../common/objs/message_object';
import { generateUniqueKey } from '../../www/utils/common';
import { ResponseObjectDecoder } from '../../common/objs/response_object';
import { ROUTER_PATHS } from '../../common/routers';

async function init() {
    useSimulator(SimulatorZoneNo.FIRST, SimulatorDeviceNo.FIRST);
    await waitStackRuntime(DEC_ID);
}

async function retrieveMessage(msgKey: string) {
    const stackWraper = checkStack();
    // Create a delete Message object
    const MessageObj = Message.create({
        key: msgKey,
        content: '',
        decId: DEC_ID,
        owner: stackWraper.checkOwner()
    });
    // make a request
    const ret = await stackWraper.postObject(MessageObj, MessageDecoder, {
        reqPath: ROUTER_PATHS.RETRIEVE_MESSAGE,
        decId: DEC_ID
    });

    if (ret.err) {
        console.error(`reponse err, ${ret}`);
        return null;
    }
    // Parse out the ResponseObject object
    const msgRawObj = ret.unwrap();

    if (msgRawObj) {
        return `current Message key is ${msgRawObj.key}, content is ${msgRawObj.content}`;
    }
    return null;
}

async function main() {
    await init();
    const msgKey = '';
    const r = await retrieveMessage(msgKey);
    if (r) {
        console.log(`retrieve message result: ${r}`);
    } else {
        console.error('retrieve message failed.');
    }
}

main();
