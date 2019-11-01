import { BrowserInstallHistory } from './stats';

export type FirefoxInstalls = {
    count: number;
    date: string;
};

export const normalizeFirefoxInstalls = (firefoxInstallHistory: FirefoxInstalls[]) => {
    const browserInstallHistory: BrowserInstallHistory = {};

    for (const firefoxInstalls of firefoxInstallHistory) {
        const dateString = new Date(`${firefoxInstalls.date}Z`).toISOString();

        browserInstallHistory[dateString] = firefoxInstalls.count;
    }

    return browserInstallHistory;
};
