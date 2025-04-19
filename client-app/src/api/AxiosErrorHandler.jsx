import { useContext, useEffect } from 'react';
import axios from 'axios';
import { backendApi } from './backend';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

export const AxiosErrorHandler = ({ children }) => {
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    const axiosInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          logout();
        }
      },
    );
    const backendApiInterceptor = backendApi.interceptors.response.use(
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
        if (error.response?.status === 401) {
          logout();
        }
        if (error.response?.status >= 400 && error.response?.status < 500) {
          // This is a validation issue, we should pop a toast to the user
          toast.error(error.response.data?.message);
        }
        return Promise.reject(error);
      },
    );
    return () => {
      axios.interceptors.response.eject(axiosInterceptor);
      backendApi.interceptors.response.eject(backendApiInterceptor);
    };
  }, [logout]);

  return children;
};
