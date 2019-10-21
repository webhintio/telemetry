import * as fs from 'fs';
import * as path from 'path';
import anyTest, { TestInterface } from 'ava';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';

import { AIResponseQuery } from '../../src/retention-data/types';
import { getISODateString } from '../../src/retention-data/utils';

const activitiesResponse: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'activities28days.json'), 'utf-8')); // eslint-disable-line no-sync
const retentionResponse: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'retention.json'), 'utf-8')); // eslint-disable-line no-sync
const retentionEmptyResponse: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'retention-empty.json'), 'utf-8')); // eslint-disable-line no-sync

type Request = {
    get: (url: string) => Promise<AIResponseQuery>;
}

type APIContext = {
    sandbox: sinon.SinonSandbox;
    request: Request;
}

const test = anyTest as TestInterface<APIContext>;

const loadScript = (context: APIContext) => {
    return proxyquire('../../src/retention-data/api', { './request': context.request });
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

const queryTemplate = `query=customEvents | where name == 'f12-activity' and todatetime(customDimensions["lastUpdated"]) >= todatetime('%%startDate%%') and todatetime(customDimensions["lastUpdated"]) < todatetime('%%endDate%%') | project customDimensions`;
const daysToProcess = 28;

const getExpectedQueries = (date: Date) => {
    const initialDateString = getISODateString(date.getTime());
    const result: string[] = [];

    for (let i = 0; i < daysToProcess; i++) {
        const endDate = new Date(initialDateString);

        endDate.setUTCDate(endDate.getUTCDate() - i);
        const endDateString = getISODateString(endDate.getTime());

        const startDate = new Date(endDateString);

        startDate.setUTCDate(startDate.getUTCDate() - 1);

        const startDateString = getISODateString(startDate.getTime());

        const activityEndpoint = queryTemplate
            .replace('%%startDate%%', startDateString)
            .replace('%%endDate%%', endDateString);

        result.push(activityEndpoint);
    }

    return result;
};

test(`'getActivities' will request the data day by day`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get').resolves(activitiesResponse);

    const { getActivities } = loadScript(t.context);

    const now = new Date();

    await getActivities(now);

    const expectedQueries = getExpectedQueries(now);
    const actualQueries = requestGetStub.args.map((arg) => {
        return arg[0]!.split('?')[1];
    });

    t.plan(29);
    t.is(requestGetStub.callCount, daysToProcess);

    expectedQueries.forEach((query) => {
        t.true(actualQueries.includes(query));
    });
});

test(`'getLatestRetention' will return null if there is no data in App Insight`, async (t) => {
    sinon.stub(t.context.request, 'get').resolves(retentionEmptyResponse);

    const { getLatestRetention } = loadScript(t.context);

    const now = new Date();

    const result = await getLatestRetention(now);

    t.is(result, null);
});

test(`'getLatestRetention' will request the data in just one query`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get').resolves(retentionResponse);

    const { getLatestRetention } = loadScript(t.context);

    const now = new Date();

    await getLatestRetention(now);

    t.true(requestGetStub.calledOnce);
});
