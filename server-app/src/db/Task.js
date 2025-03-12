import mongoose from 'mongoose';

export const TaskType = Object.freeze({
  STORY: 'story',
  TASK: 'task',
  BUG: 'bug',
  EPIC: 'epic',
});

export const TaskStatus = Object.freeze({
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
});

// These will be mapped on the UI to:
// 'must have', 'could have', 'should have', 'won't have this time', 'won't do'
export const TaskPriority = Object.freeze({
  HIGHEST: 'highest',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  LOWEST: 'lowest',
});

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: false,
      default: 1,
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.TASK,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.BACKLOG,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    points: {
      type: Number,
      default: 0,
    },
    businessValue: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
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
  },
  {
    unique: [{ project: 1, name: 1 }], // Ensure 1 project = 1 user = 1 role
  },
);

TaskSchema.pre('save', async function (next) {
  if (!this.isNew) return next(); // Only run on new documents

  try {
    // Find the max ticketNumber in the same project
    const lastTask = await Task.findOne({ project: this.project })
      .sort({ number: -1 })
      .select('number')
      .exec();

    this.number = (lastTask?.number ?? 0) + 1;
    next();
  } catch (err) {
    next(err);
  }
});

export const Task = mongoose.model('Task', TaskSchema);
