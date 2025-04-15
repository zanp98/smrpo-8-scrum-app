import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { authRouter } from './auth/index.js';
import { projectsRouter } from './projects/index.js';
import { sprintsRouter } from './sprints/index.js';
import { userStoriesRouter } from './userStories/index.js';
import { usersRouter } from './users/index.js';
import { tasksRouter } from './tasks/index.js';
import { postsRouter } from './posts/index.js';

export const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);

apiRouter.use('/projects', authMiddleware, projectsRouter);

apiRouter.use('/sprints', authMiddleware, sprintsRouter);

apiRouter.use('/userStories', authMiddleware, userStoriesRouter);

apiRouter.use('/users', authMiddleware, usersRouter);

apiRouter.use(`/tasks`, authMiddleware, tasksRouter);

apiRouter.use('/posts', authMiddleware, postsRouter);
