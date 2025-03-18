import { UserStory } from '../../db/UserStory.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired } from '../../middleware/auth.js';
import {
  CAN_CREATE_USER_STORIES,
  CAN_DELETE_USER_STORIES,
  CAN_READ_USER_STORIES,
  CAN_UPDATE_USER_STORIES,
} from '../../configuration/rolesConfiguration.js';
import { ValidationError } from '../../middleware/errors.js';

export const userStoriesRouter = express.Router();

// Get all userStories for a sprint
userStoriesRouter.get(
  '/:projectId/:sprintId?',
  projectRolesRequired(CAN_READ_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { projectId, sprintId } = req.params;
      const userStories = await UserStory.find({
        project: projectId,
        ...(!!sprintId ? { sprint: sprintId } : {}),
      })
        .populate('assignee', 'username firstName lastName')
        .populate('sprint');

      res.json(userStories);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

userStoriesRouter.post(
  '/:projectId/:sprintId?',
  projectRolesRequired(CAN_CREATE_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { projectId, sprintId } = req.params;
    const { title, description, type, status, priority, points, businessValue, assignee } =
      req.body;
    const reporter = req.user.id;
    const userStory = await UserStory.create({
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
    return res.status(201).json(userStory);
  }),
);

userStoriesRouter.patch(
  '/:projectId/:userStoryId',
  projectRolesRequired(CAN_UPDATE_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { projectId, userStoryId } = req.params;
    const {
      title,
      description,
      type,
      status,
      priority,
      points,
      businessValue,
      assignee,
      sprintId,
    } = req.body;
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
    if (!nonUndefinedFields) {
      throw new ValidationError('No update fields provided');
    }
    const userStory = await UserStory.updateOne({ _id: userStoryId }, nonUndefinedFields);
    return res.status(201).json(userStory);
  }),
);

userStoriesRouter.delete(
  '/:projectId/:userStoryId',
  projectRolesRequired(CAN_DELETE_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    const { userStoryId } = req.params;
    const userStory = await UserStory.deleteOne({ _id: userStoryId });
    return res.status(202).json(userStory);
  }),
);
