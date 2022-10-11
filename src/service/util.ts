import { checkStack } from '../common/cyfs_helper/stack_wraper';
import { PEOPLE_IDS } from '../common/constant';

// get your friend people
export function getFriendPeopleId() {
    const ownerId = checkStack().checkOwner().to_base_58();
    return PEOPLE_IDS[0] === ownerId ? PEOPLE_IDS[1] : PEOPLE_IDS[0];
}
