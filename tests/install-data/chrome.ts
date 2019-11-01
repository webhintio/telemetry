import * as fs from 'fs';
import * as path from 'path';
import test from 'ava';

import { normalizeChromeInstalls } from '../../src/install-data/chrome';

const rawStats = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'chrome.json'), 'utf-8')); // eslint-disable-line no-sync

test('It can normalize install data from Chrome', (t) => {
    const stats = normalizeChromeInstalls(rawStats);

    t.deepEqual(stats, {
        '2019-10-01T00:00:00.000Z': 51,
        '2019-10-02T00:00:00.000Z': 32,
        '2019-10-03T00:00:00.000Z': 102,
        '2019-10-04T00:00:00.000Z': 46,
        '2019-10-05T00:00:00.000Z': 7,
        '2019-10-06T00:00:00.000Z': 19,
        '2019-10-07T00:00:00.000Z': 29,
        '2019-10-08T00:00:00.000Z': 35,
        '2019-10-09T00:00:00.000Z': 23,
        '2019-10-10T00:00:00.000Z': 21
    });
});
