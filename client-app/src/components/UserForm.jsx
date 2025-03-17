import React, { useEffect, useState } from 'react';
import '../styles/user-form.css';

const UserForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    systemRole: 'user',
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setFormData({
      username: initialData.username || '',
      password: '',
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      systemRole: initialData.systemRole || 'user',
    });
  }, [initialData]);

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username || !formData.firstName || !formData.lastName || !formData.email) {
      setError('All fields are required');
      return;
    }

    // If it's a new user, password is required
    if (!initialData && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    const result = await onSubmit(formData);
    if (result) {
      setError(result);
    }
  };

  return (
    <div className="user-form-container">
      <h3>{initialData ? 'Edit User' : 'Add New User'}</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!!initialData}
            required
          />
        </div>

        {!initialData && (
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <div className="form-group">
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

        <div className="form-group">
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

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="systemRole">Role</label>
          <select
            id="systemRole"
            name="systemRole"
            value={formData.systemRole}
            onChange={handleChange}
          >
            <option value="user">User</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          {initialData ? 'Update User' : 'Add User'}
        </button>
      </form>
    </div>
  );
};

export default UserForm;
