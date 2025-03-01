import express from 'express';
import auth from '../middleware/auth.js';
import { authRouter } from './auth/index.js';
import { projectsRouter } from './projects/index.js';
import { sprintsRouter } from './sprints/index.js';
import { tasksRouter } from './tasks/index.js';
import { usersRouter } from './users/index.js';

export const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);

apiRouter.use('/projects', auth, projectsRouter);

apiRouter.use('/projects', auth, sprintsRouter);

apiRouter.use('/sprints', auth, tasksRouter);

apiRouter.use('/users', auth, usersRouter);
