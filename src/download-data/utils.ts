/**
 * Calculate the ISO string given a date at the 0 hours, 0 minutes and 0 seconds.
 * @param {number} dateInMS - Date in milliseconds to convert.
 */
export const getISODateString = (dateInMS: number = Date.now()) => {
    const date = new Date(dateInMS);

    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);

    return date.toISOString();
};
