import express from 'express';
import { projectRolesRequired } from '../../middleware/auth.js';
import { CAN_LOG_TIME } from '../../configuration/rolesConfiguration.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { validateStartTimer, validateStopTimer, validateTime } from './time-log-validator.js';
import { TimeLog } from '../../db/TimeLog.js';
import { ValidationError } from '../../middleware/errors.js';
import { timeDifferenceInHours } from '../../utils/date-util.js';
import { TimeLogEntry } from '../../db/TimeLogEntry.js';

export const timeLogRouter = express.Router();

timeLogRouter.post(
  '/start/:taskId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.id;
    await validateStartTimer(userId, taskId);
    await TimeLog.create({ user: userId, task: taskId });
    res.status(201).json({ message: 'Timer started' });
  }),
);

timeLogRouter.post(
  '/stop/:taskId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;
    await validateStopTimer(userId, taskId);
    const existingTimeLog = await TimeLog.findOne({ user: userId, task: taskId, stoppedAt: null });
    if (!existingTimeLog) {
      throw new ValidationError('Timer not started for the selected task');
    }
    const stoppedAt = Date.now();

    // Round it up to hours
    const timeInHours = timeDifferenceInHours(existingTimeLog.startedAt, stoppedAt);
    existingTimeLog.stoppedAt = stoppedAt;
    await existingTimeLog.save();

    await TimeLogEntry.create({ user: userId, task: taskId, time: timeInHours, description });
    res.status(201).json({ message: 'Timer stopped and time logged successfully' });
  }),
);

timeLogRouter.post(
  '/manual/:taskId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    const { time } = req.body;
    const userId = req.user.id;
    validateTime(time);
    await TimeLog.create({ user: userId, task: taskId, time });
    res.status(201).json({ message: 'Time log created' });
  }),
);
