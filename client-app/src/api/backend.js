import axios from 'axios';
import { toast } from 'react-toastify';

const restApiUrl = process.env.REACT_APP_REST_API_URL ?? 'http://localhost:8000';

export const backendApi = axios.create({
  baseURL: `${restApiUrl}/api/v1`,
});

backendApi.interceptors.response.use(
  (response) => {
    if (response.status >= 200 && response.status < 300 && response.data?.message) {
      // This is a success message, we should pop a toast to the user
      toast.success(response.data.message);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 418) {
      return Promise.reject(error);
    }
    if (error.response?.status >= 400 && error.response?.status < 500) {
      // This is a validation issue, we should pop a toast to the user
      toast.error(error.response.data?.message);
    }
    return Promise.reject(error);
  },
);

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

export const getProjectUsers = async (projectId) => {
  try {
    return backendApi.get(`/projects/users/${projectId}`).then((res) => res.data);
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
