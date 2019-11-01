import { Page } from 'puppeteer';

// TODO: Store in Azure Vault instead
const email = process.env.WEBHINT_STATS_EMAIL!; // eslint-disable-line no-process-env
const password = process.env.WEBHINT_STATS_PASSWORD!; // eslint-disable-line no-process-env
const chromeAuthUrl = 'https://chrome.google.com/webstore/developer/dashboard';
const firefoxAuthUrl = 'https://addons.mozilla.org/en-US/developers/';

const delay = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const signIn = async (page: Page) => {
    await page.waitForSelector('input[type=password]');
    await page.type('input[type=email]', email);
    await page.keyboard.press(String.fromCharCode(13));
    await delay(1000);
    await page.waitForSelector('input[type=password]');
    await page.type('input[type=password]', password);

    await Promise.all([
        await page.keyboard.press(String.fromCharCode(13)),
        await page.waitForNavigation()
    ]);
};

export const signInChrome = async (page: Page) => {
    await page.goto(chromeAuthUrl);
    await signIn(page);
};

export const signInFirefox = async (page: Page) => {
    await page.goto(firefoxAuthUrl);
    await page.click('.DevHub-Navigation-Open');
    await Promise.all([
        page.click('.DevHub-Navigation-Register .Button'),
        page.waitForNavigation()
    ]);
    await signIn(page);
};
