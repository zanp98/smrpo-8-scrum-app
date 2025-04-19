import { Sprint } from '../../db/Sprint.js';
import { Project } from '../../db/Project.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { ProjectRole } from '../../db/ProjectUserRole.js';
import { projectRolesRequired } from '../../middleware/auth.js';
import { ProjectUserRole } from '../../db/ProjectUserRole.js';
import { UserRoles } from '../../db/User.js';
import {
  CAN_CREATE_SPRINT,
  CAN_DELETE_SPRINT,
  CAN_EDIT_SPRINT_OF_USER_STORIES,
  CAN_READ_SPRINT,
  CAN_UPDATE_SPRINT,
} from '../../configuration/rolesConfiguration.js';
import { ValidationError } from '../../middleware/errors.js';
import { UserStory } from '../../db/UserStory.js';
import { isDateChanged, isHoliday, isWeekend } from '../../utils/date-util.js';
import { getCaseInsensitiveRegex } from '../../utils/string-util.js';

export const sprintsRouter = express.Router();

// Get all sprints for a project
sprintsRouter.get(
  '/:projectId',
  projectRolesRequired(CAN_READ_SPRINT),
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
  }),
);

//Create a new Sprint
sprintsRouter.post(
  '/addSprint/:projectId',
  projectRolesRequired(CAN_CREATE_SPRINT),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { name, project, startDate, endDate, expectedVelocity, goal, status } = req.body;

      // Validate project existence
      const existingProject = await Project.findById(project);
      if (!existingProject) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Validate dates
      const today = new Date().toISOString().split('T')[0]; // Get today's date as 'YYYY-MM-DD'
      const sprintStart = new Date(startDate).toISOString().split('T')[0]; // Get sprint start date as 'YYYY-MM-DD'

      console.log('Today (date only):', today);
      console.log('Sprint Start Date (date only):', sprintStart);

      if (sprintStart < today) {
        return res.status(400).json({ message: 'Sprint start date cannot be in the past' });
      }
      if (new Date(endDate) < new Date(startDate)) {
        return res.status(400).json({ message: 'Sprint end date must be after start date' });
      }

      // Check for weekends
      if (isWeekend(startDate)) {
        return res.status(400).json({ message: 'Sprint start date cannot be weekend' });
      }
      if (isWeekend(endDate)) {
        return res.status(400).json({ message: 'Sprint end date cannot be weekend' });
      }

      // Check for holidays
      if (isHoliday(startDate)) {
        return res.status(400).json({ message: 'Sprint start date cannot be a holiday' });
      }

      if (isHoliday(endDate)) {
        return res.status(400).json({ message: 'Sprint end date cannot be a holiday' });
      }

      // Validate velocity
      if (expectedVelocity < 1 || isNaN(expectedVelocity)) {
        return res.status(400).json({ message: 'Sprint velocity must be a positive number' });
      }

      // Check for overlapping sprints
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

      const sprintWithSameName = await Sprint.findOne({
        project,
        name: { $regex: getCaseInsensitiveRegex(name) },
      });

      if (sprintWithSameName) {
        return res.status(400).json({ message: 'Sprint with same name already exists' });
      }

      // Create and save sprint
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
sprintsRouter.delete(
  '/deleteSprint/:sprintId',
  projectRolesRequired(CAN_DELETE_SPRINT),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { sprintId } = req.params;
      const userId = req.user.id; // Authenticated user

      // Find the sprint
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({ message: 'Sprint not found' });
      }

      // Check if sprint has already started
      if (new Date(sprint.startDate) <= new Date()) {
        return res.status(400).json({ message: 'Cannot delete a sprint that has already started' });
      }

      // Get the project associated with the sprint
      const projectId = sprint.project;

      // Check if the user is the Scrum Master for this project
      const userRole = await ProjectUserRole.findOne({ project: projectId, user: userId });
      const isScrumMaster = userRole && userRole.role === ProjectRole.SCRUM_MASTER;
      const isAdmin = req.user.role === UserRoles.ADMIN;

      if (!isScrumMaster && !isAdmin) {
        return res.status(403).json({ message: 'Only Scrum Masters can delete this sprint' });
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
sprintsRouter.put(
  '/updateSprint/:sprintId',
  projectRolesRequired(CAN_UPDATE_SPRINT),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { sprintId } = req.params;
      const { name, startDate, endDate, expectedVelocity, goal, status } = req.body;
      const userId = req.user.id; // Authenticated user

      // Find sprint
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({ message: 'Sprint not found' });
      }

      // Get the project associated with the sprint
      const projectId = sprint.project;

      // Check if the user is the Scrum Master for this project
      const userRole = await ProjectUserRole.findOne({ project: projectId, user: userId });
      const isScrumMaster = userRole && userRole.role === ProjectRole.SCRUM_MASTER;
      const isAdmin = req.user.role === UserRoles.ADMIN;

      if (!isScrumMaster && !isAdmin) {
        return res.status(403).json({ message: 'Only Scrum Masters can update this sprint' });
      }

      // Validate dates
      const isStartDateChanged = isDateChanged(startDate, sprint.startDate);
      if (isStartDateChanged) {
        if (startDate && new Date(startDate) < new Date()) {
          return res.status(400).json({ message: 'Sprint start date cannot be in the past' });
        }
      }
      const isEndDateChanged = isDateChanged(endDate, sprint.endDate);
      if (isStartDateChanged || isEndDateChanged) {
        if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
          return res.status(400).json({ message: 'Sprint end date must be after start date' });
        }
      }

      // Validate velocity
      if (expectedVelocity !== undefined && (expectedVelocity < 1 || isNaN(expectedVelocity))) {
        return res.status(400).json({ message: 'Sprint velocity must be a positive number' });
      }

      // Update sprint
      const updatedSprint = await Sprint.findByIdAndUpdate(
        sprintId,
        { name, startDate, endDate, expectedVelocity, goal, status },
        { new: true }, // Return updated document
      );

      res.status(200).json(updatedSprint);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

sprintsRouter.post(
  '/assignToSprint/:projectId',
  projectRolesRequired(CAN_EDIT_SPRINT_OF_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { userStories, sprintId } = req.body;

    if (!userStories?.length || !sprintId) {
      throw new ValidationError('No stories or sprintId provided');
    }
    await UserStory.updateMany({ _id: { $in: userStories } }, { sprint: sprintId });
    return res.sendStatus(201);
  }),
);
