import { AzureFunction, Context } from '@azure/functions';

import { getStats } from './stats';

const processInstallData: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    await getStats();
};

export default processInstallData;
