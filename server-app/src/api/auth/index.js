import jwt from 'jsonwebtoken';
import express from 'express';
import { User } from '../../db/User.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authRouter = express.Router();

authRouter.post(
  '/login',
  errorHandlerWrapped(async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: 'User does not exist' });
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          systemRole: user.systemRole,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '1d' },
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          systemRole: user.systemRole,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);
