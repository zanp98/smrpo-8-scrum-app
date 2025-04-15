import mongoose from 'mongoose';

const TimeLogSchema = new mongoose.Schema({
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
    // required: [true, 'Time value is required'],
    // validate: {
    //   validator: function (v) {
    //     return v >= 0;
    //   },
    //   message: (props) => `${props.value} is not a positive number!`,
    // },
  },
  type: {
    type: String,
    default: 'timer',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  stoppedAt: {
    type: Date,
    default: null,
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

// SST: Soft-delete through hooks
// TimeLogSchema.pre('find', async function () {
//   this.where({ deletedAt: null });
// });
//
// TimeLogSchema.pre('findOne', async function () {
//   this.where({ deletedAt: null });
// });
//
// TimeLogSchema.pre('deleteOne', async function () {
//   await User.updateOne({ _id: this._conditions.id }, { deletedAt: Date.now() }).exec();
//   console.log(`User[${this._conditions.id}] deleted`);
// });

export const TimeLog = mongoose.model('TimeLog', TimeLogSchema);
