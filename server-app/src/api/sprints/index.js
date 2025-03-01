import { Sprint } from '../../db/Sprint.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';

export const sprintsRouter = express.Router();

// Get all sprints for a project
sprintsRouter.get(
  '/:projectId/sprints',
  errorHandlerWrapped(async (req, res) => {
    try {
      const sprints = await Sprint.find({
        project: req.params.projectId,
      });

      res.json(sprints);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);
