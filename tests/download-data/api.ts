import * as fs from 'fs';
import * as path from 'path';
import anyTest, { TestInterface } from 'ava';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';

import { AIResponseQuery, FirefoxDownloads } from '../../src/download-data/types';

const firefoxDownloadsResponse: FirefoxDownloads = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'firefox-downloads.json'), 'utf-8')); // eslint-disable-line no-sync
const downloadsResponse: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'downloads.json'), 'utf-8')); // eslint-disable-line no-sync
const downloadsEmptyResponse: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'downloads-empty.json'), 'utf-8')); // eslint-disable-line no-sync

type Request = {
    get: (url: string) => Promise<any>;
}

type APIContext = {
    sandbox: sinon.SinonSandbox;
    request: Request;
}

const test = anyTest as TestInterface<APIContext>;

const loadScript = (context: APIContext) => {
    return proxyquire('../../src/download-data/api', { got: context.request });
};

test.beforeEach((t) => {
    t.context.sandbox = sinon.createSandbox();

    t.context.request = {
        get(url: string) {
            return null as any;
        }
    };
});

test.afterEach((t) => {
    t.context.sandbox.restore();
});

test(`'getFirefoxDownloadData' will request the data in just one query`, async (t) => {
    const requestStub = sinon.stub(t.context.request, 'get').resolves({ body: firefoxDownloadsResponse });

    const { getFirefoxDownloadData } = loadScript(t.context);

    const start = new Date('2020-02-07');
    const end = new Date('2020-02-09');

    const result = await getFirefoxDownloadData(start, end);

    t.true(requestStub.calledOnce);
    t.is(requestStub.firstCall.args[0].split('/').pop(), `downloads-day-20200207-20200209.json`);
    t.is(result.length, 3);
    t.is(result[0].browser, 'Firefox');
    t.is(result[0].count, 10);
    t.deepEqual(result[0].date, end);
});

test(`'getLatestDownloads' will return null if there is no data in App Insight`, async (t) => {
    sinon.stub(t.context.request, 'get').resolves({ body: downloadsEmptyResponse });

    const { getLatestDownloads } = loadScript(t.context);

    const now = new Date();

    const result = await getLatestDownloads(now);

    t.is(result, null);
});

test(`'getLatestDownloads' will request the data in just one query`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get').resolves({ body: downloadsResponse });

    const { getLatestDownloads } = loadScript(t.context);

    const now = new Date();

    await getLatestDownloads(now);

    t.true(requestGetStub.calledOnce);
});
