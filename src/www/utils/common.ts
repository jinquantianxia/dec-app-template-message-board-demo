import * as cyfs from 'cyfs-sdk';
import { checkStack } from '@src/common/cyfs_helper/stack_wraper';
import { checkMetaClient } from '@src/common/cyfs_helper/meta_client';

export function randomString(len = 4) {
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
    const charsLen = chars.length;
    let str = '';
    for (let i = 0; i < len; i++) str += chars.charAt(Math.floor(Math.random() * charsLen));
    return str;
}

export function generateUniqueKey() {
    const timestamp = new Date().getTime();
    const key = `${timestamp}_${randomString()}`;
    return key;
}

export function fileIdToCyfsURL(peopleId: string, fileId: string): string {
    if (!fileId) return '';
    return `cyfs://o/${peopleId}/${fileId}`;
}

/**
 * query people info from metachain
 * @param peopleId cyfs.PeopleI
 * @returns
 */
export async function queryPeopleInfo(peopleId: cyfs.PeopleId): Promise<string | null> {
    const stack = checkStack();
    const gr = await stack.getObject(peopleId.object_id, cyfs.PeopleDecoder, {
        level: cyfs.NONAPILevel.NOC
    });

    if (gr.err) {
        console.error(`get people object(${peopleId.object_id.to_base_58()}) failed, ${gr}.`);
        return null;
    }

    const metaClient = checkMetaClient();
    const r = await metaClient.check().getDesc(peopleId.object_id);
    if (r.err) {
        console.error(`find poeple(${peopleId.object_id.to_base_58()}) failed, ${r}.`);
        return null;
    }
    const meta = r.unwrap();
    const people = meta.match({ People: (people) => people });
    if (!people) {
        const msg = `find people(${peopleId.object_id.to_base_58()}) failed, not people?`;
        console.error(msg);
        return null;
    } else {
        const name = people.name();
        // const fileIdObj = people.icon();
        // const fileId = fileIdObj ? fileIdObj.to_base_58() : '';
        // const iconURL = fileIdToCyfsURL(peopleId.to_base_58(), fileId);
        return name ? name : null;
    }
}
