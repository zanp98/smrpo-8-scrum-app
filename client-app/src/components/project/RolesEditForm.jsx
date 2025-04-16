import React, { useEffect, useState } from 'react';
import { getAllProjects, updateCurrentProject, getAllUsers } from '../../api/backend';
import '../../styles/forms.css';

export const RolesEditForm = ({ onClose, activeProjectId }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    owner: '',
    scrumMaster: '',
    members: [],
  });

  const [projects, setProjects] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await getAllProjects();
        setProjects(projects);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // 2. Select active project
  useEffect(() => {
    if (projects.length && activeProjectId) {
      const selected = projects.find((p) => String(p._id) === String(activeProjectId));
      if (selected) {
        handleProjectSelect(selected._id);
      }
    }
  }, [projects, activeProjectId]);

  // 3. When selecting a project, fetch users
  const handleProjectSelect = async (projectId) => {
    const selectedProject = projects.find((project) => project._id === projectId);
    if (selectedProject) {
      try {
        const users = await getAllUsers();

        console.log(users);
        // Setting raw user data directly in the state (no map operation)
        setProjectUsers(users); // Store users as they are

        // Map selected project data to form
        setFormData({
          name: selectedProject.name,
          key: selectedProject.key,
          description: selectedProject.description,
          owner: selectedProject.owner?._id || '',
          scrumMaster: selectedProject.scrumMaster || '',
          members: selectedProject.members || [],
        });
      } catch (err) {
        console.error('Failed to fetch project users:', err);
        setError('Failed to load project users.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const members = [
        {
          user: formData.owner,
          role: 'product_owner',
        },
        {
          user: formData.scrumMaster,
          role: 'scrum_master',
        },
      ].filter((m) => !!m.user);
      formData.members.forEach((member) => {
        if (members.find((m) => m.user === member)) {
          return;
        }
        members.push({
          user: member,
          role: 'developer',
        });
      });
      const mappedFormData = {
        ...formData,
        members,
      };
      const result = await updateCurrentProject(activeProjectId, mappedFormData);
      console.log('Project updated successfully:', result);
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
      setError('Failed to update project.');
    }
  };

  if (loading) {
    return (
      <div className="general-form-container">
        <p>Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="general-form-container">
      <h3 onClick={onClose}>^</h3>

      {formData.name && (
        <form className="general-form" onSubmit={handleSubmit}>
          <h3>
            Edit Project: {formData.name} (ID: {formData.key})
          </h3>

          <div className="form-group">
            <label htmlFor="name">Project Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="owner">Owner</label>
            <select
              id="owner"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              required
            >
              <option value="">Select Owner</option>
              {projectUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}{' '}
                  {/* Access firstName and lastName inside `user` */}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="scrumMaster">Scrum Master</label>
            <select
              id="scrumMaster"
              value={formData.scrumMaster}
              onChange={(e) => setFormData({ ...formData, scrumMaster: e.target.value })}
              required
            >
              <option value="">Select Scrum Master</option>
              {projectUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}{' '}
                  {/* Access firstName and lastName inside `user` */}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="members">Members</label>
            <select
              id="members"
              multiple
              value={formData.members}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  members: Array.from(e.target.selectedOptions, (option) => option.value),
                })
              }
              required
            >
              {projectUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}{' '}
                  {/* Access firstName and lastName inside `user` */}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Update Project
          </button>
        </form>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};
