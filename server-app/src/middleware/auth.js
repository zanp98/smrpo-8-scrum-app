import jwt from 'jsonwebtoken';
import { totp } from 'speakeasy';
import { Sprint } from '../db/Sprint.js';
import { ProjectUserRole } from '../db/ProjectUserRole.js';
import { UserStory } from '../db/UserStory.js';
import { User } from '../db/User.js';
import { Task } from '../db/Task.js';
import { TimeLogEntry } from '../db/TimeLogEntry.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const getToken = (req) => {
  const token = req.header('x-auth-token');
  if (token) {
    return token;
  }
  const bearerToken = req.header('authorization');
  const [bearer, authToken] = bearerToken?.split(' ');
  if (bearer === 'Bearer') {
    return authToken;
  }
};

export const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = getToken(req);

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Add user from payload
    req.user = decoded;
    console.log(`USER DECODED: ${JSON.stringify(req.user)}`);
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Added in case we need to use 2fa along any operation, such as user edit.
 *
 * @param req the request
 * @param res the response
 * @param next next function
 */
export const tfaMiddleware = async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findOne({ _id: id });
  if (!user) {
    return res.status(401).json({ message: 'No user found' });
  }
  if (!user.twoFactorAuthenticationEnabled) {
    return next();
  }
  const tfaCode = req.header('tfa');
  if (!tfaCode) {
    return res.sendStatus(418);
  }
  const verified = totp.verify({
    secret: key,
    encoding: 'base32',
    token: otp,
  });
  if (!verified) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  return next();
};

export const systemRolesRequired = (...roles) => {
  return (req, res, next) => {
    const requestingUser = req.user;
    if (!requestingUser || !(roles ?? []).includes(requestingUser.systemRole)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  };
};

const getProjectId = async (req) => {
  const projectId = req.params.projectId;
  if (projectId) return projectId; // Return projectId if provided

  const sprintId = req.params.sprintId;
  if (sprintId) {
    const project = await Sprint.findOne({ _id: sprintId }).select('project').exec();
    return project?._id;
  }

  let userStoryId = req.params.userStoryId;
  const taskId = req.params.taskId;

  if (taskId) {
    const task = await Task.findOne({ _id: taskId });

    userStoryId = task.userStory._id;
  }

  if (userStoryId) {
    const userStory = await UserStory.findOne({ _id: userStoryId })
      .populate('project', '_id name owner')
      .exec();
    return userStory.project._id;
  }

  const timeLogEntryId = req.params.timeLogEntryId;
  if (timeLogEntryId) {
    const timeLogEntry = await TimeLogEntry.findOne({ _id: timeLogEntryId }).populate({
      path: 'task',
      populate: { path: 'userStory', populate: { path: 'project' } },
    });
    return timeLogEntry.task?.userStory?.project?.id;
  }

  // If we reach here, we have neither projectId nor sprintId
  return null;
};

export const projectRolesRequired = (...roles) => {
  const requiredRoles = roles.flat();
  return async (req, res, next) => {
    const requestingUser = req.user;
    if (!requestingUser) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    try {
      const projectId = await getProjectId(req);
      const assignedRole = await ProjectUserRole.findOne({
        project: projectId,
        user: requestingUser.id,
      })
        .select('role')
        .exec()
        .then((t) => t?.role);

      console.log(
        `User[${requestingUser.id}]: has project[${projectId}] privilege: ${assignedRole}]`,
      );
      if (!(requiredRoles ?? []).includes(assignedRole)) {
        if (requestingUser.role !== 'admin') {
          return res.status(403).json({ message: 'Unauthorized operation for project' });
        }
      }
      req.projectRole = assignedRole;
      next();
    } catch (err) {
      console.error(err);
      return res.status(403).json({ message: 'Unauthorized operation' });
    }
  };
};
