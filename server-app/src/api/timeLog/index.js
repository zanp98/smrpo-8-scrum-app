import express from 'express';
import { projectRolesRequired, systemRolesRequired } from '../../middleware/auth.js';
import { CAN_LOG_TIME, CAN_SEE_LOGGED_TIME } from '../../configuration/rolesConfiguration.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { validateStartTimer, validateStopTimer, validateTime } from './time-log-validator.js';
import { TimeLog } from '../../db/TimeLog.js';
import { ValidationError } from '../../middleware/errors.js';
import { timeDifferenceInHours } from '../../utils/date-util.js';
import { TimeLogEntry } from '../../db/TimeLogEntry.js';
import { ProjectRole } from '../../db/ProjectUserRole.js';
import { UserStory } from '../../db/UserStory.js';
import { UserRoles } from '../../db/User.js';

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

timeLogRouter.get(
  '/list/:projectId?',
  // TODO SST: Fix the required roles
  // systemRolesRequired(UserRoles.USER, UserRoles.ADMIN),
  // projectRolesRequired(CAN_SEE_LOGGED_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const projectRole = req.projectRole;
    if (projectRole === ProjectRole.SCRUM_MASTER && !!projectId) {
      // todo sst: load all time log entries for the whole project
      const allProjectStories = await UserStory.find({
        project: projectId,
      })
        .populate({
          path: 'tasks',
          populate: {
            path: 'timeLogEntries',
            options: { sort: { createdAt: -1 } },
            populate: { path: 'user', select: '_id username firstName lastName' },
          },
        })
        .lean()
        .exec();
      allProjectStories.forEach(
        (s) => (s.tasks = s.tasks.filter((t) => t.timeLogEntries?.length > 0)),
      );
      const filteredOut = allProjectStories.filter((s) => s.tasks.length > 0);
      return res.json(filteredOut);
    }
    // NOTE SST: loads only for the current user
    const allUserStories = await UserStory.find({})
      .populate({
        path: 'tasks',
        populate: {
          path: 'timeLogEntries',
          options: { sort: { createdAt: -1 } },
          populate: { path: 'user', select: '_id username firstName lastName' },
          match: { user: userId },
        },
      })
      .lean()
      .exec();
    allUserStories.forEach((s) => (s.tasks = s.tasks.filter((t) => t.timeLogEntries?.length > 0)));
    const filteredOut = allUserStories.filter((s) => s.tasks.length > 0);
    return res.json(filteredOut);
  }),
);

timeLogRouter.put(
  '/update/:timeLogEntryId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { timeLogEntryId } = req.params;
    const { description, time } = req.body;
    const userId = req.user.id;
    if (time < 0) {
      throw new ValidationError('Time must be greater than 0');
    }
    const entry = await TimeLogEntry.findOne({ _id: timeLogEntryId, user: userId });
    if (!entry) {
      throw new ValidationError('Time log entry does not exist');
    }
    entry.time = time;
    entry.description = description;
    await entry.save();
    res.status(201).json({ message: 'Time log updated' });
  }),
);

timeLogRouter.delete(
  '/delete/:timeLogEntryId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { timeLogEntryId } = req.params;
    const { description, time } = req.body;
    const userId = req.user.id;
    if (time < 0) {
      throw new ValidationError('Time must be greater than 0');
    }
    const entry = await TimeLogEntry.findOne({ _id: timeLogEntryId, user: userId });
    if (!entry) {
      throw new ValidationError('Time log entry does not exist');
    }
    await TimeLogEntry.deleteOne({ _id: timeLogEntryId, user: userId });
    res.status(201).json({ message: 'Time log deleted' });
  }),
);
