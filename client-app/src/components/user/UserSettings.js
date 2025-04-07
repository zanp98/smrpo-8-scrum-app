import React, { useContext, useEffect, useState } from 'react';
import '../../styles/user/user-settings.css';
import { AuthContext } from '../../context/AuthContext';
import { updateCurrentUser } from '../../api/backend';

const UserSettings = ({ onSubmit }) => {
  const { currentUser, refreshToken, loading } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    currentPassword: '',
    password: '',
    password2: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    setFormData({
      password: '',
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
    });
  }, [currentUser]);

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      setError('Please enter your password');
      return;
    }

    if (!formData.password === '' && formData.password !== formData.password2) {
      setError("Passwords don't match");
      return;
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName) {
      setError('All fields are required');
      return;
    }

    const result = await updateCurrentUser(formData);
    if (result) {
      await refreshToken();
      onSubmit?.();
    }
  };

  return (
    <div className="user-settings-form-container">
      <h3>User Settings</h3>
      {error && <div className="error-message-user-settings">{error}</div>}

      <form onSubmit={handleSubmit} className="user-settings-form">
        <div className="form-group-user-settings">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={currentUser.username}
            disabled={true}
            required
          />
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={currentUser.email}
            disabled={true}
            required
          />
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="systemRole">Role</label>
          <select id="systemRole" name="systemRole" value={currentUser.systemRole} disabled={true}>
            <option value="user">User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="password">New password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="password">Confirm new password</label>
          <input
            type="password"
            id="password2"
            name="password2"
            value={formData.password2}
            onChange={handleChange}
          />
        </div>

        <div className="form-group-user-settings">
          <label htmlFor="currentPassword">Current password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-btn-user-settings">
          Save
        </button>
      </form>
    </div>
  );
};

export default UserSettings;
