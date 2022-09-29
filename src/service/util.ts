import { checkStack } from '../common/cyfs_helper/stack_wraper';
import { peopleIds } from '../common/constant';

// get your friend people
export function getFriendPeopleId() {
    const ownerId = checkStack().checkOwner().to_base_58();
    return peopleIds[0] === ownerId ? peopleIds[1] : peopleIds[0];
}
