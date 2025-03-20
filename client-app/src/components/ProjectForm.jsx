import React, { useEffect, useMemo, useState } from 'react';
import { backendApi } from '../api/backend'; // API handler
import '../styles/forms.css';

export const ProjectRole = Object.freeze({
  ADMIN: 'admin',
  PRODUCT_OWNER: 'product_owner',
  SCRUM_MASTER: 'scrum_master',
  DEVELOPER: 'developer',
});

export const ProjectForm = ({ onClose, onProjectCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    owner: '',
    scrumMaster: '',
    members: [],
  });

  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch users to assign as project owner and members
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await backendApi.get('/users'); // Adjust if your API uses a different endpoint
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users.');
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMultiSelectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData({
      ...formData,
      members: selectedOptions,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.key || !formData.description || !formData.owner) {
      setError('All required fields must be filled.');
      return;
    }

    try {
      const mappedMembersWithRoles = (formData.members ?? []).map((member) => ({
        user: member,
        role: ProjectRole.DEVELOPER,
      }));
      if (formData.scrumMaster) {
        mappedMembersWithRoles.push({
          user: formData.scrumMaster,
          role: ProjectRole.SCRUM_MASTER,
        });
      }
      const mappedData = {
        ...formData,
        members: mappedMembersWithRoles,
      };
      await backendApi.post('/projects', mappedData);
      setSuccess('Project created successfully!');
      setFormData({
        name: '',
        key: '',
        description: '',
        owner: '',
        scrumMaster: '',
        members: [],
      });
      onProjectCreate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project.');
    }
  };

  const availableProductOwners = useMemo(
    () => users.filter((user) => !formData.members.includes(user._id)),
    [users, formData.members],
  );

  const availableUsers = useMemo(
    () => users.filter((user) => user._id !== formData.owner && user._id !== formData.scrumMaster),
    [users, formData.owner, formData.scrumMaster],
  );

  return (
    <div className="general-form-container">
      <h3 onClick={onClose}>^</h3>
      <h3>Create New Project</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="general-form">
        <div className="form-group">
          <label htmlFor="name">Project Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="key">Project Key</label>
          <input
            type="text"
            id="key"
            name="key"
            value={formData.key}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="owner">Project Owner</label>
          <select id="owner" name="owner" value={formData.owner} onChange={handleChange} required>
            <option value="">Select an owner</option>
            {availableProductOwners.map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>

          <label htmlFor="owner">Scrum master</label>
          <select
            id="scrumMaster"
            name="scrumMaster"
            value={formData.scrumMaster}
            onChange={handleChange}
            required
          >
            <option value="">Select an owner</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="members">Project Members</label>
          <select
            id="members"
            name="members"
            multiple
            value={formData.members}
            onChange={handleMultiSelectChange}
          >
            {availableUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
          <small>Hold Ctrl (Cmd on Mac) to select multiple members</small>
        </div>

        <button type="submit" className="submit-btn">
          Create Project
        </button>
      </form>
    </div>
  );
};
