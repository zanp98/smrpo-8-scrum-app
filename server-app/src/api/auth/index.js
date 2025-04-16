import jwt from 'jsonwebtoken';
import express from 'express';
import * as speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User } from '../../db/User.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { LoginAttempt } from '../../db/LoginAttempt.js';
import { authMiddleware } from '../../middleware/auth.js';
import { SmrpoError, TeapotError, UnauthorizedError } from '../../middleware/errors.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authRouter = express.Router();

const verifyTfaCode = (req, userSecret, tfa) => {
  const secret = JSON.parse(userSecret);
  const tfaCode = tfa ?? req.header('tfa');
  if (!tfaCode) {
    throw new TeapotError();
  }

  const verified = speakeasy.totp.verify({
    secret: secret.base32,
    encoding: 'base32',
    token: tfaCode,
  });
  if (!verified) {
    throw new UnauthorizedError();
  }
};

authRouter.post(
  '/login',
  errorHandlerWrapped(async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'User does not exist' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await LoginAttempt.create({ user });
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

    const lastSuccessfulLogins = await LoginAttempt.find({ user, success: true }).sort({
      createdAt: 'desc',
    });
    const lastSuccessfulLogin = lastSuccessfulLogins?.[1];

    if (user.twoFactorAuthenticationEnabled) {
      await verifyTfaCode(req, user.secretKey);
    }
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
        lastLogin: lastSuccessfulLogin?.createdAt,
        twoFactorAuthenticationEnabled: user.twoFactorAuthenticationEnabled,
      },
    });
    await LoginAttempt.create({ user, success: true });
  }),
);

authRouter.get(
  '/refresh-token',
  authMiddleware,
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.user;

    // Find user by username
    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(401).json({ message: 'User does not exist' });
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

    const lastSuccessfulLogin = await LoginAttempt.findOne({ user, success: true }).sort({
      createdAt: 'desc',
    });

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
        lastLogin: lastSuccessfulLogin?.createdAt,
        twoFactorAuthenticationEnabled: user.twoFactorAuthenticationEnabled,
      },
    });
  }),
);

authRouter.post(
  '/enable-tfa',
  authMiddleware,
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.user;
    const { code } = req.body;
    const user = await User.findOne({ _id: id });
    verifyTfaCode(req, user.secretKey, code);
    user.twoFactorAuthenticationEnabled = true;
    await user.save();
    res.sendStatus(201);
  }),
);

authRouter.get(
  '/get-qr-code',
  authMiddleware,
  errorHandlerWrapped(async (req, res) => {
    const { id } = req.user;
    const user = await User.findOne({ _id: id });
    if (!user.secretKey) {
      const secretKey = speakeasy.generateSecret({
        length: 20,
        name: `SMRPO8: ${user.email}`, // Label seen in the app
        issuer: 'SMRPO8',
      });
      user.secretKey = JSON.stringify(secretKey);
      const qrCode = await QRCode.toDataURL(secretKey.otpauth_url);
      user.qrCode = qrCode;
      await user.save();
    }

    return res.status(200).json({ qrCode: user.qrCode });
  }),
);
