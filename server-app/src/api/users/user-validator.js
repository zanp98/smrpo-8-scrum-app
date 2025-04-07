import { ValidationError } from '../../middleware/errors.js';

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

  // Check for repeated spaces that may be accidentally truncated
  // This allows single and multiple spaces, but flags if user tries to enter
  // multiple spaces and they get auto-collapsed elsewhere.
  const normalized = password.replace(/\s+/g, ' ');
  if (normalized !== password) {
    throw new ValidationError('New password contains multiple spaces'); // too short
  }
};
