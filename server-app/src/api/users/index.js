import { User, UserRoles } from '../../db/User.js';
import express from 'express';
import { systemRolesRequired } from '../../middleware/auth.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { getCaseInsensitiveRegex } from '../../utils/string-util.js';

export const usersRouter = express.Router();

// Get all users
usersRouter.get(
  '/',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: 'desc' }).exec();
    res.json(users);
  }),
);

usersRouter.post(
  '/',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    const { username, password, firstName, lastName, email, systemRole } = req.body;
    const usersCount = await User.find({
      $or: [
        {
          username: { $regex: getCaseInsensitiveRegex(username) },
        },
        {
          email: { $regex: getCaseInsensitiveRegex(email) },
        },
      ],
    })
      .countDocuments()
      .exec();
    if (usersCount) {
      return res.status(400).json({ message: 'User already exists' });
    }
    await User.create({
      username,
      password,
      firstName,
      lastName,
      email,
      systemRole,
    });
    return res.status(201).json({ message: 'Successfully created user' });
  }),
);

usersRouter.delete(
  '/:id',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.params;
    const result = await User.updateOne({ _id: id }, { deletedAt: new Date() }).exec();
    return res.status(202).json({ message: 'Successfully deleted user' });
  }),
);

usersRouter.patch(
  '/:id',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.params;
    const { username, firstName, lastName, systemRole } = req.body;
    await User.updateOne({ _id: id }, { id, username, firstName, lastName, systemRole });
    return res.status(202).json({ message: 'Successfully updated user' });
  }),
);

usersRouter.patch(
  '/restore/:id',
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.params;
    const result = await User.updateOne({ _id: id }, { deletedAt: null }).exec();
    return res.status(202).json({ message: 'Successfully restored user' });
  }),
);
