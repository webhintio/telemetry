import * as fs from 'fs';
import * as path from 'path';
import test from 'ava';

import { normalizeFirefoxInstalls } from '../../src/install-data/firefox';

const rawStats = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'firefox.json'), 'utf-8')); // eslint-disable-line no-sync

test('It can normalize install data from Firefox', (t) => {
    const stats = normalizeFirefoxInstalls(rawStats);

    t.deepEqual(stats, {
        '2019-10-01T00:00:00.000Z': 147,
        '2019-10-02T00:00:00.000Z': 128,
        '2019-10-03T00:00:00.000Z': 159,
        '2019-10-04T00:00:00.000Z': 85,
        '2019-10-05T00:00:00.000Z': 47,
        '2019-10-06T00:00:00.000Z': 30,
        '2019-10-07T00:00:00.000Z': 79,
        '2019-10-08T00:00:00.000Z': 195,
        '2019-10-09T00:00:00.000Z': 100,
        '2019-10-10T00:00:00.000Z': 112
    });
});
