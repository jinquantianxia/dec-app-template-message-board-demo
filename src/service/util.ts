import * as cyfs from 'cyfs-sdk';
import { checkStack } from '../common/cyfs_helper/stack_wraper';
import { PEOPLE_IDS } from '../common/constant';
import { ResponseObject, ResponseObjectDecoder } from '../common/objs/response_object';
import { toNONObjectInfo } from '../common/cyfs_helper/kits';

// get your friend people
export function getFriendPeopleId() {
    const ownerId = checkStack().checkOwner().to_base_58();
    return PEOPLE_IDS[0] === ownerId ? PEOPLE_IDS[1] : PEOPLE_IDS[0];
}

export function makeCommonResponse(errCode = cyfs.BuckyErrorCode.Ok, msg = 'ok') {
    const respObj = ResponseObject.create({
        errCode,
        msg,
        decId: checkStack().check().dec_id!,
        owner: checkStack().checkOwner()
    });

    return cyfs.Ok({
        action: cyfs.RouterHandlerAction.Response,
        response: cyfs.Ok({
            object: toNONObjectInfo(respObj)
        })
    });
}
