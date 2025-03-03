import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      return;
    }
    
    try {
      await login(username, password);
    } catch (err) {
      // Error is handled in AuthContext
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>Scrum Management App</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              style={{ userSelect: 'none' }}
            />
            <div className="password-toggle">
              <input
                type="checkbox"
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="showPassword">Show password</label>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-help">
          <p>Demo accounts:</p>
          <ul>
            <li>Admin: admin / admin123</li>
            <li>Product Owner: po_user / po123</li>
            <li>Scrum Master: sm_user / sm123</li>
            <li>Developer: dev1 / dev123</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
