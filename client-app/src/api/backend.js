import axios from 'axios';

export const backendApi = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});
