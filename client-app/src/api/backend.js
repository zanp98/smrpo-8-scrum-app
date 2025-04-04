import axios from 'axios';
import { toast } from 'react-toastify';

const restApiUrl = process.env.REACT_APP_REST_API_URL ?? 'http://localhost:8000';

export const backendApi = axios.create({
  baseURL: `${restApiUrl}/api/v1`,
});

backendApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 400 && error.response?.status < 500) {
      // This is a validation issue, we should pop a toast to the user
      toast.error(error.response.data?.message);
    }
    return Promise.reject(error);
  },
);

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
