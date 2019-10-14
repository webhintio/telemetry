import { getWithRetry } from './request';
import { AIResponseQuery, ActivityData, RetentionData } from './types';
import { getISODateString } from './utils';

const activityEndpointTemplate = `https://api.applicationinsights.io/v1/apps/${process.env.APPID}/query?query=customEvents | where name == 'f12-activity' and todatetime(customDimensions["lastUpdated"]) >= todatetime('%%startDate%%') and todatetime(customDimensions["lastUpdated"]) < todatetime('%%endDate%%') | project customDimensions`; // eslint-disable-line no-process-env
const retentionEndpoint = `https://api.applicationinsights.io/v1/apps/${process.env.APPID}/query?query=customEvents | where name == 'f12-retention' | sort by todatetime(customDimensions["date"]) desc | project customDimensions | take 1`; // eslint-disable-line no-process-env

const getActivityEndpoints = (date: Date) => {
    const initialDateString = getISODateString(date.getTime());
    const result: string[] = [];

    for (let i = 0; i < 28; i++) {
        const endDate = new Date(initialDateString);

        endDate.setUTCDate(endDate.getUTCDate() - i);
        const endDateString = getISODateString(endDate.getTime());

        const startDate = new Date(endDateString);

        startDate.setUTCDate(startDate.getUTCDate() - 1);

        const startDateString = getISODateString(startDate.getTime());

        const activityEndpoint = activityEndpointTemplate
            .replace('%%startDate%%', startDateString)
            .replace('%%endDate%%', endDateString);

        result.push(activityEndpoint);
    }

    return result;
};

export const getActivities = async (date: Date): Promise<ActivityData[]> => {
    const result: ActivityData[] = [];
    const activityEndpoints = getActivityEndpoints(date);

    const promises: Promise<AIResponseQuery>[] = activityEndpoints.map((activityEndpoint: string) => {
        return getWithRetry(activityEndpoint);
    });

    const aiResponses = await Promise.all(promises);

    for (const aiResponse of aiResponses) {
        const table = aiResponse.tables[0];
        const customDimensionsIndex = table.columns.findIndex((column) => {
            return column.name === 'customDimensions';
        });

        for (const row of table.rows) {
            const activityData: ActivityData = JSON.parse(row[customDimensionsIndex]!);

            activityData.lastUpdated = new Date(activityData.lastUpdated);
            result.push(activityData);
        }
    }

    return result;
};

export const getLatestRetention = async (): Promise<RetentionData | null> => {
    const aiResponse = await getWithRetry(retentionEndpoint);
    const table = aiResponse.tables[0];
    const customDimensionsIndex = table.columns.findIndex((column) => {
        return column.name === 'customDimensions';
    });

    const row = table.rows[0];

    if (!row) {
        return null;
    }

    const retentionData: RetentionData = JSON.parse(row[customDimensionsIndex]!);

    retentionData.date = new Date(retentionData.date);

    return retentionData;
};
