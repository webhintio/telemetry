export const getDaysBetweenDates = (currentDate: Date, lastDate: Date) => {
    const deltaMS = currentDate.getTime() - lastDate.getTime();

    return deltaMS / 1000 / 60 / 60 / 24;
};

export const getISODateString = (dateInMS: number = Date.now()) => {
    const date = new Date(dateInMS);

    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);

    return date.toISOString();
};

export const delay = (timeInMS: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            return resolve();
        }, timeInMS);
    });
};
