import mongoose from 'mongoose';
import { Task } from './Task.js';
import uniq from 'lodash/uniq.js';

const TimeLogEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  time: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    default: '',
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

TimeLogEntrySchema.post('save', async function (doc, next) {
  try {
    const task = await Task.findOne({ _id: doc.task });
    task.timeLogEntries = uniq([this._id, ...(task.timeLogEntries ?? [])]);
    await task.save();
    next();
  } catch (e) {
    console.error('Error assigning time log entry to task', e);
  }
});

TimeLogEntrySchema.post('delete', async function (doc, next) {
  try {
    const task = await Task.findOne({ _id: doc.task });
    task.timeLogEntries = (task.timeLogEntries ?? []).filter(
      (t) => t.toString() !== doc._id.toString(),
    );
    await task.save();
    next();
  } catch (e) {
    console.error('Error removing time log entry from task', e);
  }
});

TimeLogEntrySchema.post('deleteOne', async function (doc, next) {
  try {
    const task = await Task.findOne({ _id: doc.task });
    task.timeLogEntries = (task.timeLogEntries ?? []).filter(
      (t) => t.toString() !== doc._id.toString(),
    );
    await task.save();
    next();
  } catch (e) {
    console.error('Error removing time log entry from task', e);
  }
});

export const TimeLogEntry = mongoose.model('TimeLogEntry', TimeLogEntrySchema);
