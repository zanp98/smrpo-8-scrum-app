import express from 'express';
import { Task } from '../../db/Task.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired } from '../../middleware/auth.js';
import { ValidationError } from '../../middleware/errors.js';
import { CAN_READ_USER_STORIES, CAN_UPDATE_USER_STORIES } from '../../configuration/rolesConfiguration.js';

export const tasksRouter = express.Router();

// Get all tasks for a user story
tasksRouter.get(
  '/:userStoryId',
  projectRolesRequired(CAN_READ_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { userStoryId } = req.params;
    const tasks = await Task.find({ userStory: userStoryId })
      .populate('assignedUser', 'username firstName lastName');
    res.json(tasks);
  }),
);

// Create a new task
tasksRouter.post(
  '/:userStoryId',
  projectRolesRequired(CAN_UPDATE_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { userStoryId } = req.params;
    const { description, timeEstimation, assignedUser } = req.body;
    
    const task = await Task.create({
      description,
      timeEstimation,
      assignedUser,
      userStory: userStoryId,
    });
    
    res.status(201).json(task);
  }),
);

// Update a task
tasksRouter.patch(
  '/:taskId',
  projectRolesRequired(CAN_UPDATE_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    const { description, timeEstimation, assignedUser, status } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      taskId,
      { description, timeEstimation, assignedUser, status },
      { new: true }
    );
    
    res.json(task);
  }),
);

// Delete a task
tasksRouter.delete(
  '/:taskId',
  projectRolesRequired(CAN_UPDATE_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { taskId } = req.params;
    await Task.findByIdAndDelete(taskId);
    res.status(204).send();
  }),
);
