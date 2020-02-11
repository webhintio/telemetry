import { AzureFunction, Context } from '@azure/functions';

import { getLatestDownloads, getFirefoxDownloadData } from './api';
import { getISODateString } from './utils';
import { trackEvent, sendPendingData } from './analytics';
import { f12DownloadEvent } from './types';

const downloadData: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    const latestDownloads = await getLatestDownloads('Firefox');
    const end = new Date(getISODateString());
    let start: Date;

    if (latestDownloads) {
        start = new Date(latestDownloads.date);
        start.setUTCDate(start.getUTCDate() + 1);
    } else {
        start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 90);
    }

    if (end.getTime() - start.getTime() <= 0) {
        context.log('No data to update.');

        return;
    }

    const downloadData = await getFirefoxDownloadData(start, end);

    for (const data of downloadData.reverse()) {
        if (data.date.getTime() >= start.getTime()) {
            trackEvent(f12DownloadEvent, data);
        }
    }

    await sendPendingData();
};

export default downloadData;
