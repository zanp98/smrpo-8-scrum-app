import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { backendApi } from '../api/backend';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (token in localStorage)
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setCurrentUser(JSON.parse(user));
      // Set axios default header
      backendApi.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['x-auth-token'] = token;
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);

      const res = await backendApi.post('/auth/login', {
        username,
        password,
      });

      console.log(res);

      const { token, user } = res.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Set axios default header
      backendApi.defaults.headers.common['x-auth-token'] = token;
      axios.defaults.headers.common['x-auth-token'] = token;

      setCurrentUser(user);
      setLoading(false);

      return user;
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Remove axios default header
    delete axios.defaults.headers.common['x-auth-token'];
    delete backendApi.defaults.headers.common['x-auth-token'];

    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
