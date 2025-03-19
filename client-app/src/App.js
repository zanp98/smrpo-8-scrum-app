import React, { useContext } from 'react';
import { BrowserRouter } from 'react-router';
import { ToastContainer } from 'react-toastify';
import './App.css';
import './styles/overrides.css';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Main app component that checks authentication
const AppContent = () => {
  const { currentUser, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return <div className="App">{currentUser ? <Dashboard /> : <Login />}</div>;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
