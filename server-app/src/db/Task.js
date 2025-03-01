import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['story', 'task', 'bug', 'epic'],
    default: 'task',
  },
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'review', 'done'],
    default: 'backlog',
  },
  priority: {
    type: String,
    enum: ['highest', 'high', 'medium', 'low', 'lowest'],
    default: 'medium',
  },
  points: {
    type: Number,
    default: 0,
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  sprint: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Task = mongoose.model('Task', TaskSchema);
