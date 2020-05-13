import test from 'ava';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import { DownloadData } from '../../src/download-data/types';

const loadScript = () => {
    const stubs = {
        '../common/analytics': {
            '@noCallThru': true,
            sendPendingData() {},
            trackEvent(type: string, data: DownloadData) {}
        },
        './api': {
            '@noCallThru': true,
            getFirefoxDownloadData(start: Date, end: Date) {
                return Promise.resolve([]) as Promise<DownloadData[]>;
            },
            getLatestDownloads(browser: string) {
                return Promise.resolve(null) as Promise<DownloadData | null>;
            }
        },
        './utils': {
            '@noCallThru': true,
            getISODateString() {
                return '';
            }
        }
    };

    const module = proxyquire('../../src/download-data/index', stubs) as typeof import('../../src/download-data/index');

    return { module, stubs };
};

test('New data is logged', async (t) => {
    const { module, stubs } = loadScript();
    const downloadData = module.default;

    sinon.stub(stubs['./utils'], 'getISODateString').returns('2020-02-10');

    sinon.stub(stubs['./api'], 'getLatestDownloads').resolves({
        browser: 'Firefox',
        count: 10,
        date: new Date('2020-02-07')
    });

    const downloadsStub = sinon.stub(stubs['./api'], 'getFirefoxDownloadData').resolves([
        {
            browser: 'Firefox',
            count: 10,
            date: new Date('2020-02-09')
        },
        {
            browser: 'Firefox',
            count: 17,
            date: new Date('2020-02-08')
        },
        {
            browser: 'Firefox',
            count: 16,
            date: new Date('2020-02-07')
        }
    ]);

    const trackEventSpy = sinon.spy(stubs['../common/analytics'], 'trackEvent');

    await downloadData({ log() {} } as any);

    t.is(downloadsStub.callCount, 1);
    t.deepEqual(downloadsStub.firstCall.args[0], new Date('2020-02-08'));
    t.deepEqual(downloadsStub.firstCall.args[1], new Date('2020-02-10'));
    t.is(trackEventSpy.callCount, 2);
    t.is(trackEventSpy.firstCall.args[0], 'f12-downloads');
    t.deepEqual(trackEventSpy.firstCall.args[1], {
        browser: 'Firefox',
        count: 17,
        date: new Date('2020-02-08')
    });
    t.is(trackEventSpy.secondCall.args[0], 'f12-downloads');
    t.deepEqual(trackEventSpy.secondCall.args[1], {
        browser: 'Firefox',
        count: 10,
        date: new Date('2020-02-09')
    });
});

test('Nothing happens when data is current', async (t) => {
    const { module, stubs } = loadScript();
    const downloadData = module.default;

    sinon.stub(stubs['./utils'], 'getISODateString').returns('2020-02-09');

    sinon.stub(stubs['./api'], 'getLatestDownloads').resolves({
        browser: 'Firefox',
        count: 10,
        date: new Date('2020-02-09')
    });

    sinon.stub(stubs['./api'], 'getFirefoxDownloadData').resolves([
        {
            browser: 'Firefox',
            count: 10,
            date: new Date('2020-02-09')
        }
    ]);

    const trackEventSpy = sinon.spy(stubs['../common/analytics'], 'trackEvent');

    await downloadData({ log() {} } as any);

    t.is(trackEventSpy.callCount, 0);
});

test('First run fetches past 90 days of data', async (t) => {
    const { module, stubs } = loadScript();
    const downloadData = module.default;

    sinon.stub(stubs['./utils'], 'getISODateString').returns('2020-02-09');

    sinon.stub(stubs['./api'], 'getLatestDownloads').resolves(null);

    const downloadsSpy = sinon.spy(stubs['./api'], 'getFirefoxDownloadData');

    await downloadData({ log() {} } as any);

    const start = new Date('2020-02-09');
    const end = new Date('2020-02-09');

    start.setUTCDate(start.getUTCDate() - 90);

    t.is(downloadsSpy.callCount, 1);
    t.deepEqual(downloadsSpy.firstCall.args[0], start);
    t.deepEqual(downloadsSpy.firstCall.args[1], end);
});
