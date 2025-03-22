import dayjs from 'dayjs';
import Holidays from 'date-holidays';

const hd = new Holidays();
hd.init('SI');

const WEEKEND_DAYS = [0, 6];

export const isWeekend = (date) => {
  return WEEKEND_DAYS.includes(new dayjs(date).day());
};

export const isHoliday = (date) => {
  return hd.isHoliday(new Date(date));
};
