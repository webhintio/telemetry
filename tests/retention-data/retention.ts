import * as fs from 'fs';
import * as path from 'path';

import test from 'ava';

import { AIResponseQuery, ActivityData } from '../../src/retention-data/types';

import { getRetentionData } from '../../src/retention-data/retention';

const activities28daysRaw: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'activities28days.json'), 'utf-8')); // eslint-disable-line no-sync
const activities4daysRaw: AIResponseQuery = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'activities4days.json'), 'utf-8')); // eslint-disable-line no-sync

const parseActivities = (activitiesRaw: AIResponseQuery) => {
    const activities: ActivityData[] = activitiesRaw.tables[0].rows.map((row) => {
        const activity = JSON.parse(row[0]!);

        activity.lastUpdated = new Date(activity.lastUpdated);

        return activity;
    });

    return activities;
};

/*
 * Data used for the test
 * 1A 1100001000111001011001000001
 * 1B 1110110100011010001100001000 X
 * 1C 1101000011000001011010001011 X
 * 1D 1011111110101110101000011111
 * 1E 1000010100010001100001000000 X
 * 1F 1010010000100110001110001101 X
 * 1G 1011101110000011110001100110
 * 1H 1111101101000100000101000011 X
 * 1I 1101000011001000001101111010 X
 * 1J 1101101011100110011110101100 X
 *
 * 2B 1111011010001101000110000100 X
 * 2F 1101001000010011000111000110
 * 2K 1000000000000000000000000000 X
 * 2L 1000000000000000000000000000
 *
 * 3B 1111101101000110100011000010
 * 3H 1011111011010001000001010000 X
 * 3C 1011010000110000010110100010
 * 3K 1100000000000000000000000000
 * 3M 1000000000000000000000000000 X
 *
 * 4E 1001000010100010001100001000
 * 4H 1101111101101000100000101000
 * 4N 1000000000000000000000000000
 *
 * 5I 1000110100001100100000110111
 * 5J 1000110110101110011001111010
 * 5M 1010000000000000000000000000
 * 5O 1000000000000000000000000000
 */
test('it should calculate the rigth retention data for 28 days', (t) => {
    const now = new Date();

    const activities = parseActivities(activities28daysRaw);
    const result = getRetentionData(activities, now);

    t.is(result.oneDay, 15);
    t.is(result.twoDays, 12);
});

/*
 * 1A 1111 X
 * 1C 1111 X
 * 1F 1011 X
 * 2A 1111 X
 * 2C 1111
 * 2D 1000
 * 3B 1001 X
 * 3F 1010
 * 4A 1011
 * 4B 1100
 */
test('it should calculate the rigth retention data for 4 days', (t) => {
    const now = new Date();
    const activities = parseActivities(activities4daysRaw);
    const result = getRetentionData(activities, now);

    t.is(result.oneDay, 5);
    t.is(result.twoDays, 4);
});
