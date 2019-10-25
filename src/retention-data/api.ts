import { get } from './request';
import { AIResponseQuery, ActivityData, RetentionData } from './types';
import { getISODateString } from './utils';

const cleanQuery = (query: string) => {
    return query.replace(/\r?\n/gm, '') // remove new lines
        .replace(/\s{2,}/gm, ' '); // remove extra spaces.
};

/* eslint-disable no-process-env */
/*
 * `startDate` and `endDate` are going to be always set to midnight e.g. 2019-10-17T00:00:00.000Z.
 */
const activityEndpointTemplate = cleanQuery(`https://api.applicationinsights.io/v1/apps/${process.env.APPID}/query?
query=customEvents
            | where name == 'f12-activity'
              and todatetime(customDimensions["lastUpdated"]) >= todatetime('%%startDate%%')
              and todatetime(customDimensions["lastUpdated"]) < todatetime('%%endDate%%')
            | project customDimensions`);
const retentionEndpoint = cleanQuery(`https://api.applicationinsights.io/v1/apps/${process.env.APPID}/query?
query=customEvents
      | where name == 'f12-retention'
      | sort by todatetime(customDimensions["date"]) desc
      | project customDimensions
      | take 1`);
/* eslint-enable no-process-env */
const daysToProcess = 28;

/**
 * Calculate the API endpoints to get the activity entries.
 * @param {Date} date - Date since we want to get the activity.
 */
const getActivityEndpoints = (date: Date) => {
    const initialDateString = getISODateString(date.getTime());
    const result: string[] = [];

    for (let i = 0; i < daysToProcess; i++) {
        const endDate = new Date(initialDateString);

        endDate.setUTCDate(endDate.getUTCDate() - i);
        const endDateString = getISODateString(endDate.getTime());

        const startDate = new Date(endDateString);

        startDate.setUTCDate(startDate.getUTCDate() - 1);

        const startDateString = getISODateString(startDate.getTime());

        const activityEndpoint = activityEndpointTemplate
            .replace('%%startDate%%', startDateString)
            .replace('%%endDate%%', endDateString)
            .replace(/\r?\n/gm, '')
            .replace(/\s{2,}/gm, ' ');

        result.push(activityEndpoint);
    }

    return result;
};

/**
 * Return the activities for the last 28 days in Application Insights.
 * @param {Date} date - Day since we want to get the activities.
 */
export const getActivities = async (date: Date): Promise<ActivityData[]> => {
    const result: ActivityData[] = [];
    const activityEndpoints = getActivityEndpoints(date);

    const promises: Promise<AIResponseQuery>[] = activityEndpoints.map((activityEndpoint: string) => {
        return get(activityEndpoint);
    });

    const aiResponses = await Promise.all(promises);

    /*
     * We are using the query API for Application Insight.
     * This API will return something like this:
     * {
     * "tables": [
     *     {
     *         "name": "PrimaryResult",
     *         "columns": [
     *             {
     *                 "name": "column1",
     *                 "type": "type1"
     *             },
     *             {
     *                 "name": "column2",
     *                 "type": "type2"
     *             }
     *         ],
     *         "rows": [
     *             [
     *                 "data1","data2"
     *             ],
     *             [
     *                 "data1","data2"
     *             ]
     *         ]
     *     }
     * ]
     * }
     *
     * That why we need to find the column we need the data from, in this
     * case 'customDimensions'.
     *
     * On the queries we are projecting only the column we need, but
     * just in case, we will look for the right column.
     */
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

/**
 * Return the lates retention data we have in Application Insights
 */
export const getLatestRetention = async (): Promise<RetentionData | null> => {
    const aiResponse = await get(retentionEndpoint);
    const table = aiResponse.tables[0];
    const customDimensionsIndex = table.columns.findIndex((column) => {
        return column.name === 'customDimensions';
    });

    const row = table.rows[0];

    if (!row) {
        return null;
    }

    const retentionData: RetentionData = JSON.parse(row[customDimensionsIndex]!);

    // `retentionData.date` is already normalized to UTC.
    retentionData.date = new Date(retentionData.date);

    return retentionData;
};
