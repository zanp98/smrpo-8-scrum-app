import jwt from 'jsonwebtoken';

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

export default (req, res, next) => {
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
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const systemRolesRequired = (...roles) => {
  return (req, res, next) => {
    const requestingUser = req.user;
    if (!requestingUser ?? !(roles ?? []).includes(requestingUser.role)) {
      return res.status(403).json({ message: 'No role provided' });
    }
    next();
  };
};
