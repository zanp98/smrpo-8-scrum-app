import express from 'express';
import { projectRolesRequired } from '../../middleware/auth.js';
import { CAN_LOG_TIME } from '../../configuration/rolesConfiguration.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { validateStartTimer, validateStopTimer, validateTime } from './time-log-validator.js';
import { TimeLog } from '../../db/TimeLog.js';

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
    const userId = req.user.id;
    await validateStopTimer(userId, taskId);
    const existingTimeLog = await TimeLog.findOne({ user: userId, task: taskId, stoppedAt: null });
    const stoppedAt = Date.now();

    // Round it up to hours
    existingTimeLog.time = Math.abs(stoppedAt - existingTimeLog.startedAt) / 36e5;
    existingTimeLog.stoppedAt = stoppedAt;

    await existingTimeLog.save();
    res.status(201).json({ message: 'Timer stopped' });
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
