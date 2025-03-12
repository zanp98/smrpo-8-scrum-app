import { Task } from '../../db/Task.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired } from '../../middleware/auth.js';
import {
  CAN_CREATE_TASKS,
  CAN_DELETE_TASKS,
  CAN_READ_TASKS,
  CAN_UPDATE_TASKS,
} from '../../configuration/rolesConfiguration.js';
import { ValidationError } from '../../middleware/errors.js';

export const tasksRouter = express.Router();

// Get all tasks for a sprint
tasksRouter.get(
  '/:projectId/:sprintId?',
  projectRolesRequired(CAN_READ_TASKS),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { projectId, sprintId } = req.params;
      const tasks = await Task.find({
        project: projectId,
        ...(!!sprintId ? { sprint: sprintId } : {}),
      }).populate('assignee', 'username firstName lastName');

      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

tasksRouter.post(
  '/:projectId/:sprintId?',
  projectRolesRequired(CAN_CREATE_TASKS),
  errorHandlerWrapped(async (req, res) => {
    const { projectId, sprintId } = req.params;
    const { title, description, type, status, priority, points, businessValue, assignee } =
      req.body;
    const reporter = req.user.id;
    const task = await Task.create({
      title,
      description,
      type,
      status,
      priority,
      points,
      businessValue,
      assignee,
      project: projectId,
      ...(!!sprintId ? { sprint: sprintId } : {}),
      reporter,
    });
    return res.status(201).json(task);
  }),
);

tasksRouter.patch(
  '/:projectId/:taskId',
  projectRolesRequired(CAN_UPDATE_TASKS),
  errorHandlerWrapped(async (req, res) => {
    const { projectId, taskId } = req.params;
    const { title, description, type, status, priority, points, businessValue, assignee } =
      req.body;
    const potentialUpdates = {
      title,
      description,
      type,
      status,
      priority,
      points,
      businessValue,
      assignee,
      project: projectId,
      ...(!!sprintId ? { sprint: sprintId } : {}),
    };
    const nonUndefinedFields = Object.fromEntries(
      Object.entries(potentialUpdates).filter(([_, v]) => v !== undefined),
    );
    if (!nonUndefinedFields.length) {
      throw new ValidationError('No update fields provided');
    }
    const task = await Task.updateOne({ _id: taskId }, nonUndefinedFields);
    return res.status(201).json(task);
  }),
);

tasksRouter.delete(
  '/:projectId/:taskId',
  projectRolesRequired(CAN_DELETE_TASKS),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    const task = await Task.deleteOne({ _id: taskId });
    return res.status(202).json(task);
  }),
);
