import axios from 'axios';

const restApiUrl = process.env.REACT_APP_REST_API_URL ?? 'http://localhost:8000';

export const backendApi = axios.create({
  baseURL: `${restApiUrl}/api/v1`,
});

export const getUserQRCode = async () => {
  try {
    return backendApi.get(`/auth/get-qr-code`);
  } catch (e) {
    console.error('Error while fetching QR code', e);
  }
};

export const enableUserTfa = async (code) => {
  try {
    return backendApi.post(`/auth/enable-tfa`, { code });
  } catch (e) {
    console.error('Error while fetching QR code', e);
  }
};

export const getSprintUserStories = async ({ projectId, sprintId }) => {
  try {
    return backendApi.get(`/userStories/${projectId}/${sprintId}`).then((res) => res.data);
  } catch (e) {
    console.error('Error while fetching sprint user stories', e);
  }
};

export const getProjectUsers = async (projectId, userId = '') => {
  try {
    const endpoint = [projectId, userId].filter(Boolean).join('/');
    return backendApi.get(`/projects/users/${endpoint}`).then((res) => res.data);
  } catch (error) {
    console.error('Failed to project user data');
  }
};

export const getUserStories = async (projectId) => {
  try {
    return backendApi.get(`/userStories/${projectId}`).then((res) => res.data);
  } catch (err) {
    console.error('Failed to fetch user stories');
  }
};

export const getProjectSprints = async (projectId) => {
  try {
    return await backendApi.get(`/sprints/${projectId}`).then((res) => res.data);
  } catch (err) {
    console.error('Failed to fetch project sprints');
  }
};

export const addStoriesToSprint = async (userStories, sprintId, projectId) => {
  try {
    return await backendApi.post(`/sprints/assignToSprint/${projectId}`, {
      userStories,
      sprintId,
    });
  } catch (err) {
    console.error('Failed to add stories to sprint');
  }
};

// Users
export const updateCurrentUser = async (userData) => {
  try {
    return await backendApi.patch(`/users/current-user`, userData);
  } catch (err) {
    console.error('Failed to update user', err);
  }
};

export const getAllProjects = async () => {
  try {
    return await backendApi.get('/projects').then((res) => res.data); // Updated to fetch all projects
  } catch (err) {
    console.error('Failed to fetch projects', err);
  }
};

export const updateCurrentProject = async (projectId, updatedProjectData) => {
  try {
    const response = await backendApi.put(`/projects/${projectId}`, updatedProjectData);
    return response.data;
  } catch (err) {
    console.error('Failed to update project', err);
    throw err;
  }
};

export const getAllUserRoles = async () => {
  try {
    const response = await backendApi.get('/projects/projectUserRoles');
    return response.data;
  } catch (err) {
    console.error('Failed to fetch project user roles', err);
    throw err;
  }
};

export const getAllUsers = async () => {
  try {
    // Sending GET request to the backend route that returns all users
    const response = await backendApi.get('/users');
    return response.data; // Assuming the response is in the `data` field
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error; // Optionally rethrow the error if you want it handled elsewhere
  }
};

// Time logs
export const startTimer = async (taskId) => {
  try {
    const response = await backendApi.post(`/time-log/start/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
};

export const stopTimer = async (taskId) => {
  try {
    const response = await backendApi.post(`/time-log/stop/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
};

export const addManualTimer = async (taskId, time) => {
  try {
    const response = await backendApi.post(`/time-log/manual/${taskId}`, { time });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all users:', error);
    throw error;
  }
};

export const updateCurrentSprint = async (sprintId, updatedSprintData) => {
  try {
    // Sending GET request to the backend route that returns all users
    const response = await backendApi.put(`/sprints/updateSprint/${sprintId}`, updatedSprintData);
    return response.data; // Assuming the response is in the `data` field
  } catch (error) {
    console.error('Failed to update sprint:', error);
    throw error; // Optionally rethrow the error if you want it handled elsewhere
  }
};
