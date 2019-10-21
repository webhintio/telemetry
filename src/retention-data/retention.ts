import { ActivityData, RetentionData } from './types';
import { getISODateString, getDaysBetweenDates } from './utils';

/**
 * Calculate the redundant activity given an activity.
 * Mark the first matching entry per day.
 * @param {ActivityData} activity - Current activity.
 * @param {ActivityData[]} previousActivities - Rest of the activities.
 */
const markRedundantActivity = (activity: ActivityData, previousActivities: ActivityData[]): void => {
    const activityDate = activity.lastUpdated;
    let lastRedundantDate = activityDate;

    for (const previousActivity of previousActivities) {
        if (previousActivity.redundant) {
            continue;
        }

        const date = previousActivity.lastUpdated;
        const delta = getDaysBetweenDates(activityDate, date);
        // deltaRedundant will tell us if we already mark an activity as redundant for that day.
        const deltaRedundant = getDaysBetweenDates(lastRedundantDate, date);

        if (delta === 0 || deltaRedundant === 0) {
            continue;
        }

        const dataToCheckFromActivity = activity.last28Days.slice(delta);
        const dataToCheckFromPreviousActivity = previousActivity.last28Days.slice(0, -delta);

        // Two entries will match if the current suffix activity is the same as the previous prefix.
        if (dataToCheckFromActivity === dataToCheckFromPreviousActivity) {
            previousActivity.redundant = true;

            lastRedundantDate = previousActivity.lastUpdated;
        }
    }
};

/**
 * Calculate the number of activities that meet the 'atLeast' condition.
 * This method relies on the activities being sorted from newest to older.
 * @param activities - Activities.
 * @param minDaysActive - Minimum number of 1 that the activity should have.
 */
const countIfActiveFor = (minDaysActive: number, activities: ActivityData[]): number => {
    let total = 0;
    const initialDate = activities[0].lastUpdated;

    for (const activity of activities) {
        if (activity.redundant) {
            continue;
        }
        const delta = getDaysBetweenDates(initialDate, activity.lastUpdated);
        const deltaLast28Days = delta === 0 ? activity.last28Days : activity.last28Days.slice(0, -delta);
        const daysActive = [...deltaLast28Days].reduce((t, value) => {
            return value === '1' ? t + 1 : t;
        }, 0);

        if (daysActive >= minDaysActive) {
            total++;
        }
    }

    return total;
};

/**
 * Calculate the retention data given a set of activities.
 * @param activities - Activities to use as base for the calculation
 * @param date - Date of the retention data.
 */
export const getRetentionData = (activities: ActivityData[], date: Date): RetentionData => {
    const sortedActivities = [...activities].sort((activityA, activityB) => {
        const timeAInMS = activityA.lastUpdated.getTime();
        const timeBInMS = activityB.lastUpdated.getTime();

        return timeBInMS - timeAInMS;
    });

    for (let i = 0; i < sortedActivities.length; i++) {
        const activity = sortedActivities[i];

        if (activity.redundant) {
            continue;
        }

        // Use the current activity to ignore redundant activities before it.
        markRedundantActivity(activity, sortedActivities.slice(i + 1));
    }

    const result: RetentionData = {
        date: getISODateString(date.getTime()),
        oneDay: countIfActiveFor(1, sortedActivities),
        twoDays: countIfActiveFor(2, sortedActivities)
    };

    return result;
};
