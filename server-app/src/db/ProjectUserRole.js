import mongoose from 'mongoose';

export const ProjectRole = Object.freeze({
  ADMIN: 'admin',
  PRODUCT_OWNER: 'product_owner',
  SCRUM_MASTER: 'scrum_master',
  DEVELOPER: 'developer',
});

const ProjectUserRoleSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ProjectRole),
      required: true,
      default: ProjectRole.DEVELOPER,
    },
  },
  {
    unique: [{ project: 1, user: 1 }], // Ensure 1 project = 1 user = 1 role
  },
);

export const ProjectUserRole = mongoose.model('ProjectUserRole', ProjectUserRoleSchema);
