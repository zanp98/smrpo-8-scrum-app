import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router';
import { Link } from 'react-router';
import { backendApi } from '../api/backend';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';
import { Projects } from './Projects';
import { UsersList } from './UsersList';

const Dashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await backendApi.get('/projects');
        setProjects(res.data);

        if (res.data.length > 0) {
          setActiveProject(res.data[0]);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectChange = (project) => {
    setActiveProject(project);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">Scrum Management</div>
        <div className="user-info">
          <span>
            {currentUser?.firstName} {currentUser?.lastName}
          </span>
          <span className="user-role">{currentUser?.systemRole?.replace('_', ' ')}</span>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <aside className="sidebar">
          {currentUser.systemRole === 'admin' && (
            <div>
              <h3>
                <Link to="/users">User Management</Link>
              </h3>
            </div>
          )}
          <div className="projects-list">
            <h3>Projects</h3>
            {projects.length > 0 ? (
              <ul>
                {projects.map((project) => (
                  <Link to={`/project/${project._id}`} key={project._id}>
                    <li
                      key={project._id}
                      className={activeProject?._id === project._id ? 'active' : ''}
                      onClick={() => handleProjectChange(project)}
                    >
                      {project.name}
                    </li>
                  </Link>
                ))}
              </ul>
            ) : (
              <p>No projects found</p>
            )}
          </div>
        </aside>

        <Routes>
          <Route path="/" element={<Projects activeProject={activeProject} />} />
          <Route path="/project/:projectId" element={<Projects activeProject={activeProject} />} />
          <Route path="/users" element={<UsersList />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
