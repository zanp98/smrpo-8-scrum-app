import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    timeEstimation: {
      type: Number,
      required: true,
      min: 0,
    },
    assignedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userStory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserStory',
      required: true,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE'],
      default: 'TODO',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const Task = mongoose.model('Task', TaskSchema);
