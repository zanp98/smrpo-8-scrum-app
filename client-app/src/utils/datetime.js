const defaultFormatter = Intl.DateTimeFormat('sl-SL');
const defaultTimeFormatter = Intl.DateTimeFormat('sl-SL', { timeStyle: 'short' });

export const formatDate = (date) => defaultFormatter.format(new Date(date));

const formatTime = (date) => defaultTimeFormatter.format(new Date(date));

export const formatDateTime = (date) => `${formatDate(date)}, ${formatTime(date)}`;

export const isDateInFuture = (date) => new Date() - new Date(date) < 0;

export const isNowBetween = (startDate, endDate) => {
  const now = new Date();
  const toDateEoD = new Date(endDate);
  toDateEoD.setHours(23, 59, 59, 999);
  return new Date(startDate) < now && now < toDateEoD;
};

export const roundNumberToPointOne = (num) => (Math.ceil(num * 10) / 10).toFixed(1);

export const toHours = (num) => Math.abs(num / 36e5);
