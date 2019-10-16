import { AzureFunction, Context } from '@azure/functions';

import { getLatestRetention, getActivities } from './api';
import { ActivityData } from './types';
import { getDaysBetweenDates, getISODateString } from './utils';
import { getRetentionData } from './retention';
import { trackEvent, sendPendingData } from './analytics';

const retentionData: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    if (myTimer.IsPastDue) {
        context.log('Timer function is running late!');
    }

    const activitiesByDate = new Map<Date, ActivityData[]>();
    const latestRetention = await getLatestRetention();
    const dates: Date[] = [];

    if (!latestRetention) {
        context.log('No latest retention found, using "now" as date');
        dates.push(new Date(getISODateString()));
    } else {
        const delta = getDaysBetweenDates(new Date(getISODateString()), latestRetention.date as Date);

        // If delta === 0, we already have the retention data for today.
        if (delta !== 0) {
            const today = new Date(getISODateString());

            for (let i = 0; i < delta; i++) {
                const date = new Date(today);

                date.setUTCDate(date.getUTCDate() - i);

                dates.push(date);
            }
        }
    }

    if (dates.length === 0) {
        context.log('No data to update.');

        return;
    }

    for (const date of dates) {
        activitiesByDate.set(date, await getActivities(date));
    }

    for (const [date, activities] of activitiesByDate) {
        const retentionData = getRetentionData(activities, date);

        trackEvent('f12-retention', retentionData);
    }

    await sendPendingData();
};

export default retentionData;
