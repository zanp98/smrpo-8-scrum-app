import { Sprint } from '../../db/Sprint.js';
import { Project } from '../../db/Project.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired } from '../../middleware/auth.js';
import {
  CAN_CREATE_SPRINT,
  CAN_UPDATE_SPRINT,
  CAN_DELETE_SPRINT,

} from '../../configuration/rolesConfiguration.js';

export const sprintsRouter = express.Router();

// Get all sprints for a project
sprintsRouter.get(
  '/:projectId',
  errorHandlerWrapped(async (req, res) => {
    try {
      const { projectId } = req.params;

      // Check if the project exists
      const projectExists = await Project.exists({ _id: projectId });
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Fetch sprints for the project
      const sprints = await Sprint.find({ project: projectId }).sort({ endDate: 'desc' });

      res.json(sprints);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);

//Create a new Sprint
sprintsRouter.post( //TODO: add systemRolesRequired(CAN_CREATE_SPRINT)
  '/addSprint',
  errorHandlerWrapped(async (req, res) => {
    try {
      const { name, project, startDate, endDate, expectedVelocity, goal, status } = req.body;

      // Validate project existence
      const existingProject = await Project.findById(project);
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }

      //Validate dates
      const now = new Date();
      if (new Date(startDate) < now) {
        return res.status(400).json({ message: 'Sprint start date cannot be in the past' });
      }
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ message: 'Sprint end date must be after start date' });
      }

      //Validate velocity
      if (expectedVelocity < 1 || isNaN(expectedVelocity)) {
        return res.status(400).json({ message: 'Sprint velocity must be a positive number' });
      }

      //Check for overlapping sprints
      const overlappingSprint = await Sprint.findOne({
        project,
        $or: [
          { startDate: { $lt: new Date(endDate), $gte: new Date(startDate) } },
          { endDate: { $gt: new Date(startDate), $lte: new Date(endDate) } },
        ],
      });

      if (overlappingSprint) {
        return res.status(400).json({ message: 'Sprint overlaps with an existing sprint' });
      }

      //Create and save sprint
      const sprint = new Sprint({
        name,
        project,
        startDate,
        endDate,
        expectedVelocity,
        goal,
        status,
      });

      await sprint.save();
      res.status(201).json(sprint);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

//Delete a sprint
sprintsRouter.delete( //TODO: add systemRolesRequired(CAN_DELETE_SPRINT)
  '/deleteSprint/:sprintId',
  errorHandlerWrapped(async (req, res) => {
    try {
      const { sprintId } = req.params;

      // Find the sprint
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({ message: 'Sprint not found' });
      }

      // Check if sprint has already started
      if (new Date(sprint.startDate) <= new Date()) {
        return res.status(400).json({ message: 'Cannot delete a sprint that has already started' });
      }

      // Delete sprint
      await Sprint.findByIdAndDelete(sprintId);
      res.status(200).json({ message: 'Sprint deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

//Update a sprint
sprintsRouter.put( //TODO: add systemRolesRequired(CAN_UPDATE_SPRINT)
  '/updateSprint/:sprintId',
  errorHandlerWrapped(async (req, res) => {
    try {
      const { sprintId } = req.params;
      const { name, startDate, endDate, expectedVelocity, goal, status } = req.body;

      // Find sprint
      let sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({ message: 'Sprint not found' });
      }

      // Validate dates
      if (startDate && new Date(startDate) < new Date()) {
        return res.status(400).json({ message: 'Sprint start date cannot be in the past' });
      }
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ message: 'Sprint end date must be after start date' });
      }

      // Validate velocity
      if (expectedVelocity !== undefined && (expectedVelocity < 1 || isNaN(expectedVelocity))) {
        return res.status(400).json({ message: 'Sprint velocity must be a positive number' });
      }

      // Update sprint
      sprint = await Sprint.findByIdAndUpdate(
        sprintId,
        { name, startDate, endDate, expectedVelocity, goal, status },
        { new: true }, // Return updated document
      );

      res.status(200).json(sprint);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);
