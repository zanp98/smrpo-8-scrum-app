import { User, UserRoles } from '../../db/User.js';
import express from 'express';
import { authMiddleware, systemRolesRequired } from '../../middleware/auth.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { getCaseInsensitiveRegex } from '../../utils/string-util.js';
import { ValidationError } from '../../middleware/errors.js';
import { validateEmail, validateNewPassword, validateUsername } from './user-validator.js';

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
  '/current-user',
  authMiddleware,
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.user;
    const { username, currentPassword, firstName, lastName, password, email } = req.body;
    const user = await User.findOne({ _id: id });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ValidationError('Password is incorrect');
    }
    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    if (password?.length) {
      validateNewPassword(password);
      user.password = password;
    }
    if (email?.length) {
      await validateEmail(email, id);
      user.email = email;
    }
    await validateUsername(username, id);
    await user.save();

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

usersRouter.patch(
  '/:id',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.params;
    const { username, firstName, lastName, systemRole, password, email } = req.body;
    const user = await User.findOne({ _id: id });
    if (password?.length) {
      validateNewPassword(password);
      user.password = password;
    }
    if (email?.length) {
      await validateEmail(email, id);
      user.email = email;
    }
    await validateUsername(username, id);
    user.username = username;
    user.firstName = firstName;
    user.lastName = lastName;
    user.systemRole = systemRole;
    await user.save();
    return res.status(202).json({ message: 'Successfully updated user' });
  }),
);
