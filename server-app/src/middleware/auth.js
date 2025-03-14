import jwt from 'jsonwebtoken';
import { Sprint } from '../db/Sprint.js';
import { ProjectUserRole } from '../db/ProjectUserRole.js';

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
    if (!requestingUser || !(roles ?? []).includes(requestingUser.role)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  };
};

const getProjectId = async (req) => {
  const projectId = req.params.projectId;
  if (projectId) {
    return projectId;
  }
  const sprintId = req.params.sprintId;
  if (sprintId) {
    const project = await Sprint.find({ projectId }).select('project').exec();
    return project._id;
  }
  return res.status(403).json({ message: 'Unauthorized' });
};

export const projectRolesRequired = (...roles) => {
  const requiredRoles = roles.flat();
  return async (req, res, next) => {
    const requestingUser = req.user;
    if (!requestingUser) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const projectId = await getProjectId(req);
    const assignedRoles = await ProjectUserRole.findOne({
      project: projectId,
      user: requestingUser.id,
    })
      .select('role')
      .exec()
      .then((t) => t.role);

    console.log(`User: ${requestingUser.id}`);
    console.log(`projectId: ${projectId}`);
    console.log(`db roles: ${assignedRoles}`);
    console.log(`required roles: ${requiredRoles}`);

    if (!(requiredRoles ?? []).includes(assignedRoles)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    next();
  };
};
