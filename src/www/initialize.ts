// Initialization
import { DEC_ID } from '../common/constant';
import {
    waitStackRuntime,
    useSimulator,
    SimulatorZoneNo,
    SimulatorDeviceNo
} from '../common/cyfs_helper/stack_wraper';
import * as MetaClient from '../common/cyfs_helper/meta_client';

export async function init() {
    // zoneNo: FIRST -> simulator1, SECOND -> simulator2, REAL -> production environment
    // deviceNo: Just use the default SimulatorDeviceNo.FIRST
    useSimulator(SimulatorZoneNo.SECOND, SimulatorDeviceNo.FIRST);
    // MetaClient choose "beta"
    MetaClient.init(MetaClient.EnvTarget.BETA);
    await waitStackRuntime(DEC_ID);
}
