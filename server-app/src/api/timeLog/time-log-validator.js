import { TimeLog } from '../../db/TimeLog.js';
import { ValidationError } from '../../middleware/errors.js';

export const validateStartTimer = async (userId) => {
  const activeTimer = await TimeLog.findOne({
    user: userId,
    stoppedAt: null,
    type: 'timer',
  }).populate('task', '_id');
  if (activeTimer) {
    throw new ValidationError(`Active timer already exists for another user story`);
  }
};

export const validateStopTimer = async (userId, taskId) => {
  const activeTimer = await TimeLog.findOne({
    user: userId,
    task: taskId,
    stoppedAt: null,
    type: 'timer',
  }).populate('task', '_id');
  if (!activeTimer) {
    throw new ValidationError(`Active timer not found for the task`);
  }
};

export const validateTime = (time) => {
  if (!time || time <= 0) {
    throw new ValidationError('Time must be greater than 0');
  }
};
