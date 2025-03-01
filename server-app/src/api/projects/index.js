import { Project } from '../../db/Project.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';

export const projectsRouter = express.Router();

// Get all projects
projectsRouter.get(
  '/',
  errorHandlerWrapped(async (req, res) => {
    try {
      const projects = await Project.find({
        members: req.user.id,
      }).populate('owner', 'username firstName lastName');

      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);
