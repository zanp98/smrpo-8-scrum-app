import express from 'express';
import { projectRolesRequired } from '../../middleware/auth.js';
import { CAN_LOG_TIME, CAN_SEE_LOGGED_TIME } from '../../configuration/rolesConfiguration.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { validateStartTimer, validateStopTimer, validateTime } from './time-log-validator.js';
import { TimeLog } from '../../db/TimeLog.js';
import { ValidationError } from '../../middleware/errors.js';
import { timeDifferenceInHours } from '../../utils/date-util.js';
import { TimeLogEntry, TimeLogEntryType } from '../../db/TimeLogEntry.js';
import { ProjectRole } from '../../db/ProjectUserRole.js';
import { UserStory, UserStoryStatus } from '../../db/UserStory.js';
import { Sprint } from '../../db/Sprint.js';

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
  '/time-log-entry/:taskId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    const { time } = req.body;
    const userId = req.user.id;
    await TimeLogEntry.create({
      user: userId,
      task: taskId,
      time: time,
      description: 'Task was completed',
    });
    res.status(201).json({ message: 'Entry added successfully' });
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
  '/list/:projectId',
  projectRolesRequired(CAN_SEE_LOGGED_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;
    const projectRole = req.projectRole;
    if (projectRole === ProjectRole.SCRUM_MASTER) {
      // NOTE SST: load all time log entries for the whole project
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
        (s) => (s.tasks = (s.tasks ?? []).filter((t) => t.timeLogEntries?.length > 0)),
      );
      const filteredOut = allProjectStories.filter((s) => s.tasks.length > 0);
      return res.json(filteredOut);
    }
    // NOTE SST: loads only for the current user
    const allUserStories = await UserStory.find({
      project: projectId,
    })
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
    allUserStories.forEach(
      (s) => (s.tasks = (s.tasks ?? []).filter((t) => t.timeLogEntries?.length > 0)),
    );
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
    const { time } = req.body;
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

timeLogRouter.get(
  '/my-tasks/:projectId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Step 1: Get active sprint for project
    const now = new Date();
    const currentSprint = await Sprint.findOne({
      project: projectId,
      $and: [{ startDate: { $lte: now } }, { endDate: { $gt: now } }],
    });

    if (!currentSprint) {
      return res.status(200).json({
        userStories: [],
      });
    }

    // Step 2: calculate first and last day for the sprint
    const firstDay = new Date(currentSprint.startDate);
    const lastDay = new Date(currentSprint.endDate);

    // Step 3: fetch all in progress user stories in the sprint, nested with tasks and time log entries
    const userStories = await UserStory.find({
      project: projectId,
      sprint: currentSprint._id,
      status: UserStoryStatus.IN_PROGRESS,
    })
      .populate({
        path: 'tasks',
        populate: {
          path: 'timeLogEntries',
          options: { sort: { createdAt: -1 } },
          populate: { path: 'user', select: '_id username firstName lastName' },
          match: { type: TimeLogEntryType.MANUAL, user: userId },
        },
        match: { assignedUser: userId },
      })
      .lean()
      .exec();

    // Step 4: Iterate through all stories and create for missing days
    let hasCreatedEntry = false;
    for (const story of userStories) {
      for (const task of story.tasks) {
        const firstDayEpoch = firstDay.valueOf();
        for (let day = firstDayEpoch; day <= lastDay.valueOf(); day += 86400e3) {
          const matchDate = new Date(day).toISOString().substring(0, 10);
          const entryExists = (task.timeLogEntries ?? [])
            .map((tle) => new Date(tle.date).toISOString().substring(0, 10))
            .some((d) => d === matchDate);

          if (!entryExists) {
            console.log(
              `Creating missing TLEntry for user[${userId}], task[${task._id}], day[${matchDate}]`,
            );
            await TimeLogEntry.create({
              user: userId,
              task: task._id,
              time: 0,
              type: TimeLogEntryType.MANUAL,
              date: new Date(day),
            });
            hasCreatedEntry = true;
          }
        }
      }
    }

    if (!hasCreatedEntry) {
      return res.status(200).json({ userStories });
    }

    // Reload the data, just in case
    const newUserStories = await UserStory.find({
      project: projectId,
      sprint: currentSprint._id,
      status: UserStoryStatus.IN_PROGRESS,
    })
      .populate({
        path: 'tasks',
        populate: {
          path: 'timeLogEntries',
          options: { sort: { date: -1 } },
          populate: { path: 'user', select: '_id username firstName lastName' },
          match: { type: TimeLogEntryType.MANUAL, user: userId },
        },
      })
      .lean()
      .exec();
    return res.status(200).json({ userStories: newUserStories });
  }),
);

timeLogRouter.put(
  '/my-tasks/:projectId',
  projectRolesRequired(CAN_LOG_TIME),
  errorHandlerWrapped(async (req, res) => {
    const userId = req.user.id;
    const updates = req.body;
    if (!updates?.length) {
      throw new ValidationError('Time log updates missing');
    }

    // Step 1: map the updates to operations
    const bulkOps = updates.map(({ _id, time, timeLeft }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { time, timeLeft } },
      },
    }));

    // Step 2: perform bulk-write
    await TimeLogEntry.bulkWrite(bulkOps);

    return res.status(201).json({ message: 'Time logs updated successfully' });
  }),
);

// Added for debugging purposes to stop all active timers
timeLogRouter.get(
  '/stop-all-active-timers',
  errorHandlerWrapped(async (req, res) => {
    const now = new Date();
    await TimeLog.updateMany({ stoppedAt: null }, { stoppedAt: now });
    return res.status(201).json({ message: 'All active timers stopped successfully' });
  }),
);
