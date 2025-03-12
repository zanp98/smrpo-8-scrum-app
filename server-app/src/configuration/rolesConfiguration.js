import { ProjectRole } from '../db/ProjectUserRole.js';

// Everyone can CRUD tickets of their own project
export const CAN_CREATE_TASKS = Object.values(ProjectRole);
export const CAN_READ_TASKS = Object.values(ProjectRole);
export const CAN_UPDATE_TASKS = Object.values(ProjectRole);
export const CAN_DELETE_TASKS = Object.values(ProjectRole);

// Project CRUD roles
export const CAN_READ_PROJECTS = Object.values(ProjectRole);
