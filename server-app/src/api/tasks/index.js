import { Task } from '../../db/Task.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';

export const tasksRouter = express.Router();

// Get all tasks for a sprint
tasksRouter.get(
  '/sprints/:sprintId/tasks',
  errorHandlerWrapped(async (req, res) => {
    try {
      const tasks = await Task.find({
        sprint: req.params.sprintId,
      }).populate('assignee', 'username firstName lastName');

      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);
