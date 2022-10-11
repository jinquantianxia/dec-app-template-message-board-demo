import {
    checkStack,
    SimulatorDeviceNo,
    SimulatorZoneNo,
    useSimulator,
    waitStackRuntime
} from '../../common/cyfs_helper/stack_wraper';
import { DEC_ID } from '../../common/constant';
import { Message, MessageDecoder } from '../../common/objs/message_object';
import { generateUniqueKey } from '../../www/utils/common';
import { ResponseObjectDecoder } from '../../common/objs/response_object';
import { ROUTER_PATHS } from '../../common/routers';

async function init() {
    useSimulator(SimulatorZoneNo.REAL, SimulatorDeviceNo.FIRST);
    await waitStackRuntime(DEC_ID);
}

async function deleteMessage(msgKey: string) {
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
        return JSON.stringify(retObj);
    }
    return null;
}

async function main() {
    await init();
    const msgKey = '';
    const r = await deleteMessage(msgKey);
    if (r) {
        console.log(`delete message result: ${r}`);
    } else {
        console.error('delete message failed.');
    }
}

main();
