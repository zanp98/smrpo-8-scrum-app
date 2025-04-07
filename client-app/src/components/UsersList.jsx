import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import UserForm from './UserForm';
import '../styles/users-list.css';
import { backendApi } from '../api/backend';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await backendApi.get('/users');
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmitUser = async (userData) => {
    try {
      if (selectedUser) {
        // This is update
        await backendApi.patch(`/users/${selectedUser._id}`, userData);
      } else {
        // this is add
        await backendApi.post('/users', userData);
      }
      setShowAddForm(false);
      setSelectedUser(false);
      fetchUsers();
    } catch (err) {
      return err.response?.data?.message || 'Failed to add user';
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await backendApi.delete(`/users/${userId}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleEditUser = (userId) => {
    const user = users.find((user) => user._id === userId);
    setSelectedUser(user);
    setShowAddForm(true);
  };

  if (!currentUser || currentUser.systemRole !== 'admin') {
    return <div className="unauthorized">You are not authorized to view this page.</div>;
  }

  return (
    <div className="users-list-container">
      <h2>User Management</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="users-controls">
        <button
          className="add-user-btn"
          onClick={() => {
            setSelectedUser(null);
            setShowAddForm(!showAddForm);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>

      {showAddForm && <UserForm onSubmit={handleSubmitUser} initialData={selectedUser} />}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{`${user.firstName} ${user.lastName}`}</td>
                  <td>{user.email}</td>
                  <td>{user.systemRole}</td>
                  <td>
                    <button className="btn delete-btn" onClick={() => handleDeleteUser(user._id)}>
                      Delete
                    </button>
                    <button className="btn edit-btn" onClick={() => handleEditUser(user._id)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
