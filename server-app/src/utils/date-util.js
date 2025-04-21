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

export const isDateChanged = (date, other) => {
  const d1 = new Date(date);
  const d2 = new Date(other);
  return d1.getTime() !== d2.getTime();
};

export const timeDifferenceInHours = (startedAt, stoppedAt) => {
  return Math.abs(stoppedAt - startedAt) / 36e5;
};
