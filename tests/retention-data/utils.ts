import test from 'ava';

import { delay } from '../../src/retention-data/utils';

test(`'delay' should should wait for at lest the time indicated`, async (t) => {
    const waitTime = 5000;

    const now = Date.now();

    await delay(waitTime);

    const totalTime = Date.now() - now;

    t.true(totalTime >= waitTime);
});
