import jwt from 'jsonwebtoken';
import { Sprint } from '../db/Sprint.js';
import { ProjectUserRole } from '../db/ProjectUserRole.js';
import { UserStory } from '../db/UserStory.js';

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

  const userStoryId = req.params.userStoryId;
  if (userStoryId) {
    const project = await UserStory.findOne({ _id: userStoryId }).select('project').exec();
    return project?._id;
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
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }
    next();
  };
};
