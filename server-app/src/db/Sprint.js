import mongoose from 'mongoose';

const SprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  expectedVelocity: {
    type: Number,
    required: true,
    min: 1,
  },
  goal: {
    type: String,
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Sprint = mongoose.model('Sprint', SprintSchema);