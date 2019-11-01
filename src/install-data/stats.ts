import { launch, Page } from 'puppeteer';

import { signInChrome, signInFirefox } from './auth';

export type BrowserInstallHistory = { [date: string]: number };

const today = new Date()
    .toISOString()
    .split('T')[0];
const queryEnd = today.replace(/-/g, '');
const chromeStatsUrl = 'https://chrome.google.com/webstore/developer/data?tq=base_stats%3Agccemnpihkbgkdmoogenkbkckppadcag&tqx=out%3Ajson';
const firefoxStatsUrl = `https://addons.mozilla.org/en-US/firefox/addon/webhint/statistics/downloads-day-20190501-${queryEnd}.json`;

const getBrowserStats = async (page: Page, url: string) => {
    page.goto(url);

    const response = await page.waitForResponse(url);

    return await response.json();
};

const getChromeStats = async (page: Page) => {
    await signInChrome(page);

    return getBrowserStats(page, chromeStatsUrl);
};

const getFirefoxStats = async (page: Page) => {
    await signInFirefox(page);

    return getBrowserStats(page, firefoxStatsUrl);
};

export const getStats = async () => {
    const browser = await launch({ headless: false });
    const pages = await browser.pages();
    const page = pages[0];

    const chrome = await getChromeStats(page);
    const firefox = await getFirefoxStats(page);

    await browser.close();

    return { chrome, firefox };
};
