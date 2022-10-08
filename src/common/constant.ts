import * as cyfs from 'cyfs-sdk';

// cyfs.config.json -> app_id
export const DEC_ID_BASE58 = '9tGpLNnGimEmkLwbFnaabHxufDm4tFnBJsEwVayRUn7s';

export const DEC_ID = cyfs.ObjectId.from_base_58(DEC_ID_BASE58).unwrap();

// cyfs.config.json -> app_name
export const APP_NAME = 'message-board-demo';

/**
 * zone1's peopleId and zone2's peopleId
 * If here is the mac simulator environment, ~/Library/Application Support/cyfs/etc/zone-simulator/desc_list
 * If here is the windows simulator environment, C:\cyfs\etc\zone-simulator\desc_list
 * Particularly, when you publish dec app to ood, you should use real poepleIds
 */
export const peopleIds = [
    '5r4MYfFaFn1a2cFjauUmRSaYhmGq1Qex2W216qg7Fkt1',
    '5r4MYfFFxwMSFgbTHT7wNSgq81FN8tkgpfptvsXTtGM6'
];
