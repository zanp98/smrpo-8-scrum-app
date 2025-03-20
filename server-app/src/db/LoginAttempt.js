import mongoose from 'mongoose';

const LoginAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  success: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const LoginAttempt = mongoose.model('LoginAttempt', LoginAttemptSchema);
