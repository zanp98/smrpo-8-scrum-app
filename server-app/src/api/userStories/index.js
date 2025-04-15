import { UserStory, UserStoryStatus } from '../../db/UserStory.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired } from '../../middleware/auth.js';
import {
  CAN_CREATE_USER_STORIES,
  CAN_DELETE_USER_STORIES,
  CAN_READ_USER_STORIES,
  CAN_UPDATE_USER_STORIES,
  CAN_UPDATE_USER_STORIES_POINTS,
} from '../../configuration/rolesConfiguration.js';
import { ValidationError } from '../../middleware/errors.js';
import { getCaseInsensitiveRegex } from '../../utils/string-util.js';
import { Sprint } from '../../db/Sprint.js';

export const userStoriesRouter = express.Router();

// Get all userStories for a sprint
userStoriesRouter.get(
  '/:projectId/:sprintId?',
  projectRolesRequired(CAN_READ_USER_STORIES),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { projectId, sprintId } = req.params;
      // If there is sprintId we should fetch as usual:
      if (!!sprintId) {
        const userStories = await UserStory.find({
          project: projectId,
          ...{ sprint: sprintId },
        })
          .populate('assignee', 'username firstName lastName')
          .populate('sprint');

        return res.json(userStories);
      }
      // If there is no sprint id we need to fetch all stories and group
      const now = new Date();
      const currentSprintId = await Sprint.find({
        project: projectId,
        $and: [{ startDate: { $lte: now } }, { endDate: { $gt: now } }],
      }).then((s) => s._id);

      if (!currentSprintId) {
        const userStories = await UserStory.find({
          project: projectId,
          $or: [{ status: [UserStoryStatus.BACKLOG, UserStoryStatus.DONE] }],
        })
          .populate('assignee', 'username firstName lastName')
          .populate('sprint');
        return res.json(userStories);
      }
      const userStories = await UserStory.find({
        project: projectId,
        $or: [
          { status: [UserStoryStatus.BACKLOG, UserStoryStatus.DONE] },
          { sprint: currentSprintId, status: UserStoryStatus.IN_PROGRESS },
        ],
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
    const {
      title,
      description,
      acceptanceTests,
      type,
      status,
      priority,
      points,
      businessValue,
      assignee,
    } = req.body;
    const reporter = req.user.id;
    if (!title || points === undefined) {
      throw new ValidationError('Title and story points are required');
    }
    const existingStory = await UserStory.find({
      title: { $regex: getCaseInsensitiveRegex(title) },
    })
      .countDocuments()
      .exec();

    if (existingStory) {
      throw new ValidationError('User story with the same title already exists');
    }
    const userStory = await UserStory.create({
      title,
      description,
      acceptanceTests,
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

//Scrum master can update time on un-assigned user story
userStoriesRouter.patch(
  '/:projectId/:userStoryId/points',
  projectRolesRequired(CAN_UPDATE_USER_STORIES_POINTS),
  errorHandlerWrapped(async (req, res) => {
    const { projectId, userStoryId } = req.params;
    const { points } = req.body;

    if (typeof points !== 'number' || points < 0) {
      return res.status(400).json({ message: 'Points must be a non-negative number' });
    }

    const userStory = await UserStory.findOne({ _id: userStoryId, project: projectId });

    if (!userStory) {
      return res.status(404).json({ message: 'User story not found' });
    }

    if (userStory.sprint) {
      return res.status(400).json({
        message: 'Cannot edit points of a user story that is already assigned to a sprint',
      });
    }

    // Update points
    userStory.points = points;
    await userStory.save();

    return res.status(200).json(userStory);
  }),
);
