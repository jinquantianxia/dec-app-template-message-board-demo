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

async function publishMessage(msgKey: string, content: string) {
    const stackWraper = checkStack();
    // Create a new Message object
    const messageObj = Message.create({
        key: msgKey,
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
        return JSON.stringify(retObj);
    }
    return null;
}

async function main() {
    await init();
    const msgKey = generateUniqueKey();
    const content = 'test Message111';
    const r = await publishMessage(msgKey, content);
    if (r) {
        console.log(`publish message successed msgKey is ${msgKey}, result: ${r}`);
    } else {
        console.error('publish message failed.');
    }
}

main();
