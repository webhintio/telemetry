import { ActivityData, RetentionData } from './types';
import { getISODateString, getDaysBetweenDates } from './utils';

const getRedundant = (activity: ActivityData, previousActivities: ActivityData[]): void => {
    const activityDate = activity.lastUpdated;
    let lastRedundantDate = activityDate;

    for (const previousActivity of previousActivities) {
        if (previousActivity.redundant) {
            continue;
        }

        const date = previousActivity.lastUpdated;
        const delta = getDaysBetweenDates(activityDate, date);
        const deltaRedundant = getDaysBetweenDates(lastRedundantDate, date);

        if (delta === 0 || deltaRedundant === 0) {
            continue;
        }

        const dataToCheckFromActivity = activity.last28Days.slice(delta);
        const dataToCheckFromPreviousActivity = previousActivity.last28Days.slice(0, -delta);

        if (dataToCheckFromActivity === dataToCheckFromPreviousActivity) {
            previousActivity.redundant = true;

            lastRedundantDate = previousActivity.lastUpdated;
        }
    }
};

const getAtLeast = (activities: ActivityData[], atLeast: number): number => {
    let total = 0;
    const initialDate = activities[0].lastUpdated;

    for (const activity of activities) {
        if (activity.redundant) {
            continue;
        }
        const delta = getDaysBetweenDates(initialDate, activity.lastUpdated);
        const deltaLast28Days = delta === 0 ? activity.last28Days : activity.last28Days.slice(0, -delta);
        const last28Days = [...deltaLast28Days].reduce((t, value) => {
            return value === '1' ? t + 1 : t;
        }, 0);

        if (last28Days >= atLeast) {
            total++;
        }
    }

    return total;
};

export const getRetentionData = (activities: ActivityData[], date: Date): RetentionData => {
    const sortedActivities = activities
        .slice()
        .sort((activityA: ActivityData, activityB: ActivityData) => {
            const timeAInMS = activityA.lastUpdated.getTime();
            const timeBInMS = activityB.lastUpdated.getTime();

            return timeBInMS - timeAInMS;
        });

    for (let i = 0; i < sortedActivities.length; i++) {
        const activity = sortedActivities[i];

        if (activity.redundant) {
            continue;
        }

        getRedundant(activity, sortedActivities.slice(i + 1));
    }

    const result: RetentionData = {
        date: getISODateString(date.getTime()),
        oneDay: getAtLeast(sortedActivities, 1),
        twoDays: getAtLeast(sortedActivities, 2)
    };

    return result;
};
