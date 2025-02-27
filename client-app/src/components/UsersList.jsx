import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import UserForm from './UserForm';
import '../styles/users-list.css';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user: currentUser } = useContext(AuthContext);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/v1/users');
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

  const handleAddUser = async (userData) => {
    try {
      await axios.post('http://localhost:8000/api/v1/users', userData);
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      return err.response?.data?.message || 'Failed to add user';
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`http://localhost:8000/api/v1/users/${userId}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return <div className="unauthorized">You are not authorized to view this page.</div>;
  }

  return (
    <div className="users-list-container">
      <h2>User Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="users-controls">
        <button 
          className="add-user-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New User'}
        </button>
      </div>
      
      {showAddForm && (
        <UserForm onSubmit={handleAddUser} />
      )}
      
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
              users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{`${user.firstName} ${user.lastName}`}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
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

export default UsersList;
