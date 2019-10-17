import anyTest, { TestInterface } from 'ava';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import { RetentionData, ActivityData } from '../../src/retention-data/types';
import { getISODateString } from '../../src/retention-data/utils';

const proxy = proxyquire.noCallThru();

type Timer = {
    IsPastDue: boolean;
}

type FunctionsContext = {
    log: (text: string) => void;
}

type API = {
    getLatestRetention: () => Promise<RetentionData | null>;
    getActivities: (date: Date) => Promise<ActivityData[]>;
}

type Retention = {
    getRetentionData: (activities: ActivityData[], date: Date) => RetentionData;
}

type Utils = {
    getDaysBetweenDates: (currentDate: Date, lastDate: Date) => number;
    getISODateString: (dateInMS?: number) => string;
}

type Analytics = {
    trackEvent: (name: string, properties?: any) => void;
    sendPendingData: () => Promise<void>;
}

type IndexContext = {
    analytics: Analytics;
    api: API;
    functionContext: FunctionsContext;
    retention: Retention;
    sandbox: sinon.SinonSandbox;
    timer: Timer;
    utils: Utils;
}

const loadScript = (context: IndexContext) => {
    return proxy('../../src/retention-data/index', {
        './analytics': context.analytics,
        './api': context.api,
        './retention': context.retention,
        './utils': context.utils
    }).default;
};

const test = anyTest as TestInterface<IndexContext>;

test.beforeEach((t) => {
    t.context.sandbox = sinon.createSandbox();
    t.context.analytics = {
        sendPendingData() {
            return Promise.resolve();
        },
        trackEvent(name: string, properties?: any) { }
    };
    t.context.api = {
        getActivities(date: Date) {
            return null as any;
        },
        getLatestRetention() {
            return null as any;
        }
    };
    t.context.functionContext = { log(text: string) { } };
    t.context.retention = {
        getRetentionData(activities: ActivityData[], date: Date) {
            return null as any;
        }
    };
    t.context.timer = { IsPastDue: false };
    t.context.utils = {
        getDaysBetweenDates(currentDate: Date, lastDate: Date) {
            return 0;
        },
        getISODateString(dateInMs?: number) {
            return '';
        }
    };
});

test.afterEach.always((t) => {
    t.context.sandbox.restore();
});

test('If there is no retention data, it should use Date.now() as date', async (t) => {
    const expectedDate = getISODateString();
    const activity = {
        'extension-version': '1.0.0',
        last28Days: '1010101010101',
        lastUpdated: new Date(),
        redundant: false
    };
    const retentionData = {
        date: new Date(),
        oneDay: 1,
        twoDays: 1
    };

    const utilsGetIsoDateStringStub = t.context.sandbox.stub(t.context.utils, 'getISODateString').returns(expectedDate);
    const apiGetActivitiesStub = t.context.sandbox.stub(t.context.api, 'getActivities').resolves([activity]);
    const apiGetLatestRetentionStub = t.context.sandbox.stub(t.context.api, 'getLatestRetention').resolves(null);
    const retentionGetRetentionStub = t.context.sandbox.stub(t.context.retention, 'getRetentionData').returns(retentionData);
    const analyticsTrackEventStub = t.context.sandbox.stub(t.context.analytics, 'trackEvent').returns();
    const analyticsSendPendingStub = t.context.sandbox.stub(t.context.analytics, 'sendPendingData').resolves();
    const functionsContextLogSpy = t.context.sandbox.spy(t.context.functionContext, 'log');

    const script = loadScript(t.context);

    await script(t.context.functionContext, t.context.timer);

    t.true(functionsContextLogSpy.calledOnce);
    t.is(functionsContextLogSpy.args[0][0], 'No latest retention found, using "now" as date');
    t.true(utilsGetIsoDateStringStub.calledOnce);
    t.true(apiGetActivitiesStub.calledOnce);
    t.deepEqual(apiGetActivitiesStub.args[0][0], new Date(expectedDate));
    t.true(apiGetLatestRetentionStub.calledOnce);
    t.true(retentionGetRetentionStub.calledOnce);
    t.deepEqual(retentionGetRetentionStub.args[0][0], [activity]);
    t.deepEqual(retentionGetRetentionStub.args[0][1], new Date(expectedDate));
    t.true(analyticsTrackEventStub.calledOnce);
    t.is(analyticsTrackEventStub.args[0][1], retentionData);
    t.true(analyticsSendPendingStub.calledOnce);
});

test('If the last update was lest than 24 hours ago, it should do nothing', async (t) => {
    const retentionData = {
        date: new Date(),
        oneDay: 1,
        twoDays: 1
    };
    const apiGetLatestRetentionStub = t.context.sandbox.stub(t.context.api, 'getLatestRetention').resolves(retentionData);
    const utilsGetDaysStub = t.context.sandbox.stub(t.context.utils, 'getDaysBetweenDates').returns(0);
    const apiGetActivitiesSpy = t.context.sandbox.spy(t.context.api, 'getActivities');
    const analyticsTrackEventSpy = t.context.sandbox.stub(t.context.analytics, 'trackEvent');
    const functionsContextLogSpy = t.context.sandbox.spy(t.context.functionContext, 'log');

    const script = loadScript(t.context);

    await script(t.context.functionContext, t.context.timer);

    t.true(apiGetLatestRetentionStub.calledOnce);
    t.true(utilsGetDaysStub.calledOnce);
    t.true(functionsContextLogSpy.calledOnce);
    t.is(functionsContextLogSpy.args[0][0], 'No data to update.');
    t.false(apiGetActivitiesSpy.called);
    t.false(analyticsTrackEventSpy.called);
});

test('If there the last retention data is from two days ago, it should calculate the retention data for those two days', async (t) => {
    const todayDateString = getISODateString();
    const activity = {
        'extension-version': '1.0.0',
        last28Days: '1010101010101',
        lastUpdated: new Date(),
        redundant: false
    };
    const retentionData = {
        date: new Date(),
        oneDay: 1,
        twoDays: 1
    };

    const today = new Date(todayDateString);
    const yesterday = new Date(todayDateString);

    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const utilsGetDaysStub = t.context.sandbox.stub(t.context.utils, 'getDaysBetweenDates').returns(2);
    const utilsGetIsoDateStringStub = t.context.sandbox.stub(t.context.utils, 'getISODateString').returns(todayDateString);
    const apiGetActivitiesStub = t.context.sandbox.stub(t.context.api, 'getActivities').resolves([activity]);
    const apiGetLatestRetentionStub = t.context.sandbox.stub(t.context.api, 'getLatestRetention').resolves(retentionData);
    const retentionGetRetentionStub = t.context.sandbox.stub(t.context.retention, 'getRetentionData').returns(retentionData);
    const analyticsTrackEventStub = t.context.sandbox.stub(t.context.analytics, 'trackEvent').returns();
    const analyticsSendPendingStub = t.context.sandbox.stub(t.context.analytics, 'sendPendingData').resolves();
    const functionsContextLogSpy = t.context.sandbox.spy(t.context.functionContext, 'log');

    const script = loadScript(t.context);

    await script(t.context.functionContext, t.context.timer);

    t.true(utilsGetDaysStub.calledOnce);
    t.false(functionsContextLogSpy.calledOnce);
    t.true(utilsGetIsoDateStringStub.calledTwice);
    t.true(apiGetActivitiesStub.calledTwice);
    t.deepEqual(apiGetActivitiesStub.args[0][0], today);
    t.deepEqual(apiGetActivitiesStub.args[1][0], yesterday);
    t.true(apiGetLatestRetentionStub.calledOnce);
    t.true(retentionGetRetentionStub.calledTwice);
    t.deepEqual(retentionGetRetentionStub.args[0][1], today);
    t.deepEqual(retentionGetRetentionStub.args[1][1], yesterday);
    t.true(analyticsTrackEventStub.calledTwice);
    t.true(analyticsSendPendingStub.called);
});
