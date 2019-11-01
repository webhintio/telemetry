import { BrowserInstallHistory } from './stats';

export type ChromeValue<T> = {
    v: T;
};

export type ChromeInstalls = {
    c: [
        /** Date with zero-based month (e.g. in `"Date(2019,7,1)"` `7` = August) */
        ChromeValue<string>,
        /** Impressions */
        ChromeValue<number>,
        /** Installs */
        ChromeValue<number>
    ];
};

export type ChromeInstallHistory = {
    table: {
        rows: ChromeInstalls[];
    };
};

export const normalizeChromeInstalls = (chromeInstallHistory: ChromeInstallHistory) => {
    const browserInstallHistory: BrowserInstallHistory = {};

    for (const chromeInstalls of chromeInstallHistory.table.rows) {
        // e.g. `[2019, 7, 1]`
        const dateParts: [number, number, number] = chromeInstalls.c[0].v
            .replace(/Date\(|\)/g, '')
            .split(',')
            .map(Number) as any;

        const dateString = new Date(Date.UTC(...dateParts)).toISOString();

        browserInstallHistory[dateString] = chromeInstalls.c[2].v;
    }

    return browserInstallHistory;
};
