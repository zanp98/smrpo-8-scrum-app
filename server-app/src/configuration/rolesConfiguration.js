import { ProjectRole } from '../db/ProjectUserRole.js';

// Everyone can CRUD tickets of their own project
export const CAN_CREATE_USER_STORIES = Object.values(ProjectRole);
export const CAN_READ_USER_STORIES = Object.values(ProjectRole);
export const CAN_UPDATE_USER_STORIES = Object.values(ProjectRole);
export const CAN_DELETE_USER_STORIES = Object.values(ProjectRole);
export const CAN_EDIT_SPRINT_OF_USER_STORIES = [ProjectRole.SCRUM_MASTER, ProjectRole.ADMIN];

// Project CRUD roles
export const CAN_READ_PROJECTS = Object.values(ProjectRole);
