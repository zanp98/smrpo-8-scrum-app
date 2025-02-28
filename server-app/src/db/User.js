import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const UserRoles = Object.freeze({
  ADMIN: 'admin',
  PRODUCT_OWNER: 'product_owner',
  SCRUM_MASTER: 'scrum_master',
  DEVELOPER: 'developer',
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
  role: {
    type: String,
    enum: Object.values(UserRoles),
    default: 'developer',
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
