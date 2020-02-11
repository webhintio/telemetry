import { get } from 'got';
import { f12DownloadEvent, AIResponseQuery, Browser, DownloadData, FirefoxDownloads } from './types';


const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0].replace(/-/g, '');
};

const cleanQuery = (query: string) => {
    return query.replace(/\r?\n/gm, '') // remove new lines
        .replace(/\s{2,}/gm, ' '); // remove extra spaces.
};

/* eslint-disable no-process-env */
const downloadDataEndpoint = cleanQuery(`https://api.applicationinsights.io/v1/apps/${process.env.APPID}/query?
query=customEvents
      | where name == '${f12DownloadEvent}'
      | sort by todatetime(customDimensions["date"]) desc
      | project customDimensions
      | take 1`);

export const getFirefoxDownloadData = async (startDate: Date, endDate: Date) => {
    const start = getDateString(startDate);
    const end = getDateString(endDate);
    const url = `https://addons.mozilla.org/en-US/firefox/addon/webhint/statistics/downloads-day-${start}-${end}.json`;
    const data: FirefoxDownloads[] = (await get(url, { json: true })).body;

    return data.map((entry) => {
        return {
            browser: 'Firefox',
            count: entry.count,
            date: new Date(entry.date)
        } as DownloadData;
    });
};

/**
 * Return the latest download data we have in Application Insights
 */
export const getLatestDownloads = async (browser: Browser): Promise<DownloadData | null> => {
    const aiResponse: AIResponseQuery = (await get(downloadDataEndpoint, {
        headers: { 'x-api-key': process.env.X_API_KEY }, // eslint-disable-line no-process-env
        json: true,
        retry: { retries: 5 }
    })).body;

    const table = aiResponse.tables[0];
    const customDimensionsIndex = table.columns.findIndex((column) => {
        return column.name === 'customDimensions';
    });

    const row = table.rows[0];

    if (!row) {
        return null;
    }

    const downloadData: DownloadData = JSON.parse(row[customDimensionsIndex]!);

    // `downloadData.date` is already normalized to UTC.
    downloadData.date = new Date(downloadData.date);

    return downloadData;
};
