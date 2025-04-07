import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ProjectRole } from './ProjectUserRole.js';

export const UserRoles = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  passwordHint: {
    type: String,
    required: false,
    default: '',
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  systemRole: {
    type: String,
    enum: Object.values(UserRoles),
    default: UserRoles.DEVELOPER,
  },
  // TODO SST: Move this to a new table ProjectRoles
  role: {
    type: String,
    enum: Object.values(ProjectRole),
    default: ProjectRole.DEVELOPER,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    let passwordHint = '';
    for (let i = 0; i < this.password.length - 1; i++) {
      passwordHint += '*';
    }
    passwordHint += this.password.charAt(this.password.length - 1);
    this.passwordHint = passwordHint;
    next();
  } catch (e) {
    console.error('Error saving user', e);
  }
});

// SST: Soft-delete through hooks
UserSchema.pre('find', async function () {
  this.where({ deletedAt: null });
});

UserSchema.pre('findOne', async function () {
  this.where({ deletedAt: null });
});

UserSchema.pre('deleteOne', async function () {
  await User.updateOne({ _id: this._conditions.id }, { deletedAt: Date.now() }).exec();
  console.log(`User[${this._conditions.id}] deleted`);
});

export const User = mongoose.model('User', UserSchema);
