import anyTest, { TestInterface } from 'ava';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';

type Request = {
    defaults: () => Request;
    get: (endpoint: string, callback: Function) => void;
}

type APIContext = {
    sandbox: sinon.SinonSandbox;
    request: Request;
}

const test = anyTest as TestInterface<APIContext>;

const loadScript = (context: APIContext) => {
    return proxyquire('../../src/retention-data/request', { request: context.request });
};

test.beforeEach((t) => {
    t.context.sandbox = sinon.createSandbox();

    t.context.request = {
        defaults() {
            return t.context.request;
        },
        get(endpoint: string, callback: Function) {
            return;
        }
    };
});

test.afterEach((t) => {
    t.context.sandbox.restore();
});

test(`'getWithRetry' will make a request`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get')
        .callsFake((endpoint: string, callback: Function) => {
            return callback(null, { body: {} });
        });

    const { getWithRetry } = loadScript(t.context);

    await getWithRetry('url', 1);

    t.true(requestGetStub.calledOnce);
});

test(`'getWithRetry' will retry if a request returns an string`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get')
        .callsFake((endpoint: string, callback: Function) => {
            return callback(null, { body: '' });
        });

    const { getWithRetry } = loadScript(t.context);

    t.plan(1);

    try {
        await getWithRetry('url', 1);
    } catch (e) {
        t.is(requestGetStub.callCount, 4);
    }
});

test(`'getWithRetry' will retry if a request throws an error`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get')
        .callsFake((endpoint: string, callback: Function) => {
            return callback(new Error('error'));
        });

    const { getWithRetry } = loadScript(t.context);

    t.plan(1);

    try {
        await getWithRetry('url', 1);
    } catch (e) {
        t.is(requestGetStub.callCount, 4);
    }
});

test(`'getWithRetry' will retry and return the value if it works in the second try`, async (t) => {
    const requestGetStub = sinon.stub(t.context.request, 'get')
        .onFirstCall()
        .callsFake((endpoint: string, callback: Function) => {
            return callback(new Error('error'));
        })
        .onSecondCall()
        .callsFake((endpoint: string, callback: Function) => {
            return callback(null, {body: {}});
        });

    const { getWithRetry } = loadScript(t.context);

    t.plan(1);

    await getWithRetry('url', 1);

    t.true(requestGetStub.calledTwice);
});
