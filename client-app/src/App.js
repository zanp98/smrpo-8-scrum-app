import React, { useContext } from 'react';
import { BrowserRouter } from 'react-router';
import { ToastContainer } from 'react-toastify';
import './App.css';
import './styles/overrides.css';
import './styles/shared/confirm-dialog.css';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { OfferTfa } from './components/auth/OfferTfa';
import { AxiosErrorHandler } from './api/AxiosErrorHandler';

// Main app component that checks authentication
const AppContent = () => {
  const { currentUser, refreshToken } = useContext(AuthContext);

  const onDone = async () => {
    sessionStorage.setItem('isTfaOffered', 'true');
    await refreshToken();
  };

  if (!currentUser) {
    return (
      <div className="App">
        <Login />
      </div>
    );
  }
  const isTfaOffered = sessionStorage.getItem('isTfaOffered');
  if (currentUser && !currentUser.twoFactorAuthenticationEnabled && !isTfaOffered) {
    return <OfferTfa onDone={onDone} />;
  }
  return <div className="App">{<Dashboard />}</div>;
};

const App = () => {
  return (
    <AuthProvider>
      <AxiosErrorHandler>
        <BrowserRouter>
          <AppContent />
          <ToastContainer />
        </BrowserRouter>
      </AxiosErrorHandler>
    </AuthProvider>
  );
};

export default App;
