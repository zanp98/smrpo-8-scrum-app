import { useEffect, useState } from 'react';

export const TimeLogTable = ({}) => {
  const [timeLogEntries, setTimeLogsEntries] = useState([]);

  const fetchTimeLogEntries = async () => {};

  useEffect(() => {
    fetchTimeLogEntries();
  });
  return 'Time log table goes here';
};
