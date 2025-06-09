export const timegm = (date: Date = new Date()): number => {
    const now = Math.floor(Date.parse(date.toISOString()) / 1000);
    return now;
};
