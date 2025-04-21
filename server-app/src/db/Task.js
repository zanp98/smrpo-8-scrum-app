import mongoose from 'mongoose';
import { UserStory } from './UserStory.js';
import uniq from 'lodash/uniq.js';

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
    timeLogEntries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimeLogEntry',
      },
    ],
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

TaskSchema.post('save', async (doc, next) => {
  try {
    const userStory = await UserStory.findOne({ _id: doc.userStory });
    userStory.tasks = uniq([...userStory.tasks.map((t) => t.toString()), doc._id.toString()]);
    await userStory.save();
    next();
  } catch (error) {
    console.error('Error while updating user story tasks: ', error);
  }
});

export const Task = mongoose.model('Task', TaskSchema);
