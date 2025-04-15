import React, { useEffect, useState } from 'react';
import { backendApi } from '../../api/backend'; // Import API handler
import '../../styles/forms.css';

export const SprintStatus = Object.freeze({
  PLANNING: 'planning',
  ACTIVE: 'active',
  COMPLETED: 'completed',
});

export const SprintForm = ({ onClose, initialData, onSprintCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    project: '',
    startDate: '',
    endDate: '',
    expectedVelocity: 1,
    goal: '',
    status: SprintStatus.PLANNING,
  });

  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch projects from backend when component loads
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await backendApi.get('/projects'); // Calls your backend API
        setProjects(response.data);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects.');
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        project: initialData.project?._id || '', // Ensure project ID is set
        startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
        endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
        expectedVelocity: initialData.expectedVelocity || 1,
        goal: initialData.goal || '',
        status: initialData.status || SprintStatus.PLANNING,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.project || !formData.startDate || !formData.endDate) {
      setError('All required fields must be filled.');
      return;
    }

    try {
      await backendApi.post(`/sprints/addSprint/${formData.project}`, formData);
      setSuccess('Sprint created successfully!');
      setFormData({
        name: '',
        project: '',
        startDate: '',
        endDate: '',
        expectedVelocity: 1,
        goal: '',
        status: SprintStatus.PLANNING,
      });
      onSprintCreate?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create sprint.');
    }
  };

  return (
    <div className="general-form-container">
      <h3 onClick={onClose}>^</h3>
      <h3>{initialData ? 'Edit Sprint' : 'Create New Sprint'}</h3>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="general-form">
        <div className="form-group">
          <label htmlFor="name">Sprint Name</label>
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
          <label htmlFor="project">Project</label>
          <select
            id="project"
            name="project"
            value={formData.project}
            onChange={handleChange}
            required
          >
            <option value="">Select a project</option>
            {projects.length > 0 ? (
              projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  {proj.name} (Owner: {proj.owner?.firstName || 'Unknown'}{' '}
                  {proj.owner?.lastName || ''})
                </option>
              ))
            ) : (
              <option value="" disabled>
                No projects available
              </option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="expectedVelocity">Expected Velocity (in story points)</label>
          <input
            type="number"
            id="expectedVelocity"
            name="expectedVelocity"
            min="1"
            value={formData.expectedVelocity}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="goal">Sprint Goal</label>
          <textarea id="goal" name="goal" value={formData.goal} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value={SprintStatus.PLANNING}>Planning</option>
            <option value={SprintStatus.ACTIVE}>Active</option>
            <option value={SprintStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          {initialData ? 'Update Sprint' : 'Create Sprint'}
        </button>
      </form>
    </div>
  );
};
