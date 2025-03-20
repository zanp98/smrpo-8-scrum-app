const WEEKEND_DAYS = [0, 6];

export const isWeekend = (date) => {
  return WEEKEND_DAYS.includes(new dayjs(date).day());
};
