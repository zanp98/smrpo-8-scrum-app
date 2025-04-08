import React, { useEffect, useState } from 'react';
import { getAllProjects } from '../api/backend';  // Import the getAllProjects function
import '../styles/forms.css';

export const RolesEditForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    owner: '',
    scrumMaster: '',
    members: [],
  });

  const [projects, setProjects] = useState([]);  // State for projects
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all projects using the getAllProjects function
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching all projects...');
        const projects = await getAllProjects();  // Use the imported function to fetch projects
        
        // Log the fetched response before updating state
        console.log('Fetched Projects:', projects);

        if (projects.length === 0) {
          console.log('No projects found');
          setLoading(false);
          return;
        }

        // Set projects to state and log the projects after setting state
        setProjects(projects);  // Store projects
        console.log('Projects have been set in state:', projects);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('Failed to load projects.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);  // Empty dependency array to run only once on mount

  // Log the projects every time the projects state changes
  useEffect(() => {
    console.log('Projects state updated:', projects);
  }, [projects]);

  // Handle when the user selects a project
  const handleProjectSelect = (projectId) => {
    const selectedProject = projects.find(project => project._id === projectId);

    if (selectedProject) {
      setFormData({
        name: selectedProject.name,
        key: selectedProject.key,
        description: selectedProject.description,
        owner: selectedProject.owner || '',
        scrumMaster: selectedProject.scrumMaster || '',
        members: selectedProject.members || [],
      });
    }
  };

  if (loading) {
    return <div className="general-form-container"><p>Loading projects...</p></div>;
  }

  return (
    <div className="general-form-container">
      <h3 onClick={onClose}>^</h3>
      <h3>Select Project to Edit</h3>
      {error && <div className="error-message">{error}</div>}

      <div className="projects-list">
        {projects.map((project) => (
          <button
            key={project._id}
            onClick={() => handleProjectSelect(project._id)}
            className="project-item-btn"
          >
            {project.name}
          </button>
        ))}
      </div>

      {formData.name && (
        <div className="general-form">
          <h3>Edit Project: {formData.name} (ID: {formData.key})</h3>

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

          <button type="submit" className="submit-btn">
            Update Project
          </button>
        </div>
      )}
    </div>
  );
};
