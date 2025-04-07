import { ValidationError } from '../../middleware/errors.js';
import { User } from '../../db/User.js';
import { getCaseInsensitiveRegex } from '../../utils/string-util.js';
import passwordDictionary from './dict.json' with { type: 'json' };

const isInDictionary = (password) => {
  return passwordDictionary.find((p) => p.Password === password);
};

/**
 * Main backend password validation function, always update here.
 *
 * @param password the password
 */
export const validateNewPassword = (password) => {
  // Check overall length
  const length = password.length;

  if (length < 12) {
    throw new ValidationError('New password should be at least 12 characters long'); // too short
  }

  if (length > 128) {
    throw new ValidationError('New password should be less than 128 characters long'); // too short
  }

  if (length >= 64 && length <= 128) {
    throw new ValidationError('New password should not be between 64 and 128 characters long'); // too short
  }

  const dictRecord = isInDictionary(password);
  if (dictRecord) {
    throw new ValidationError(
      `Password is #${dictRecord.Rank} in a dictionary and is not safe to use`,
    );
  }

  // Check for repeated spaces that may be accidentally truncated
  // This allows single and multiple spaces, but flags if user tries to enter
  // multiple spaces and they get auto-collapsed elsewhere.
  const normalized = password.replace(/\s+/g, ' ');
  if (normalized !== password) {
    throw new ValidationError('New password contains multiple spaces'); // too short
  }
};

/**
 * Validates the username counting if another user with the same username exists.
 *
 * @param username the new username
 * @param userId id of the user to update
 */
export const validateUsername = async (username, userId) => {
  const usernameAlreadyExists = await User.find({
    username: { $regex: getCaseInsensitiveRegex(username) },
    _id: { $ne: userId },
  })
    .countDocuments()
    .exec();
  if (usernameAlreadyExists) {
    throw new ValidationError('Username already taken');
  }
};
