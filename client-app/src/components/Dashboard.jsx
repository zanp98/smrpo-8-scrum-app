import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Routes, Route } from 'react-router';
import { Link } from 'react-router';
import { backendApi, getProjectSprints } from '../api/backend';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';
import { Projects } from './Projects';
import { UsersList } from './UsersList';
import { SprintForm } from './SprintForm';
import { formatDate, isNowBetween } from '../utils/datetime';
import { Sprint } from './sprint/Sprint'; // Added SprintForm import

const Dashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [selectedProjectSprints, setSelectedProjectSprints] = useState([]);

  const currentActiveSprint = useMemo(
    () => selectedProjectSprints?.find((ps) => isNowBetween(ps.startDate, ps.endDate)),
    [selectedProjectSprints],
  );

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await backendApi.get('/projects');
        setProjects(res.data);

        if (res.data.length > 0) {
          setSelectedProject(res.data[0]);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch projects');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const fetchProjectSprints = async () => {
    if (!selectedProject) {
      setSelectedProjectSprints([]);
      return;
    }
    setLoading(true);
    const projectSprints = await getProjectSprints(selectedProject._id);
    setSelectedProjectSprints(projectSprints);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjectSprints();
  }, [selectedProject]);

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setSelectedSprint(null);
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const isCurrentProjectActiveAndHasSprints = (project) =>
    selectedProject?._id === project._id && selectedProjectSprints.length > 0;

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
          <div>
            <h3>
              <Link to="/sprints">Create Sprint</Link> {/* Added Sprint Management link */}
            </h3>
          </div>
          <div className="projects-list">
            <h3>Projects</h3>
            {projects.length > 0 ? (
              <ul className="project-list">
                {projects.map((project) => (
                  <div key={project._id}>
                    <Link to={`/project/${project._id}`}>
                      <li
                        className={`project-item ${
                          selectedProject?._id === project._id ? 'active' : ''
                        }`}
                        onClick={() => handleProjectChange(project)}
                      >
                        {project.name}
                      </li>
                    </Link>

                    {isCurrentProjectActiveAndHasSprints(project) && (
                      <ol className="sprint-list">
                        {selectedProjectSprints.map((sprint) => (
                          <li
                            key={sprint._id}
                            className={`sprint-item ${selectedSprint?._id === sprint._id ? 'active' : ''} ${currentActiveSprint?._id === sprint._id ? 'current-sprint' : ''}`}
                            onClick={() => setSelectedSprint(sprint)}
                          >
                            <Link to={`/project/${project._id}/sprint/${sprint._id}`}>
                              <span className="sprint-name">{`${sprint.name}${currentActiveSprint?._id === sprint._id ? ' (current)' : ''}`}</span>
                              <div className="sprint-dates">
                                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </ul>
            ) : (
              <p>No projects found</p>
            )}
          </div>
        </aside>

        <Routes>
          <Route
            path="/"
            element={
              <Projects
                activeProject={selectedProject}
                projectSprints={selectedProjectSprints}
                currentSprint={currentActiveSprint}
              />
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <Projects
                activeProject={selectedProject}
                projectSprints={selectedProjectSprints}
                currentSprint={currentActiveSprint}
                setActiveProject={(projectId) => {
                  if (projectId !== selectedProject?._id) {
                    const project = projects.find((p) => p._id === projectId);
                    if (project) {
                      setSelectedProject(projects);
                    }
                  }
                }}
              />
            }
          />
          <Route path="/users" element={<UsersList />} />
          <Route path="/sprints" element={<SprintForm />} /> {/* Added route for SprintForm */}
          <Route
            path="/project/:projectId/sprint/:sprintId"
            element={
              <Sprint
                project={selectedProject}
                sprint={selectedSprint}
                setActiveProject={(projectId) => {
                  if (projectId !== selectedProject?._id) {
                    const project = projects.find((p) => p._id === projectId);
                    if (project) {
                      setSelectedProject(projects);
                    }
                  }
                }}
                setActiveSprint={(sprintId) => {
                  if (sprintId !== selectedSprint?._id) {
                    const sprint = selectedProjectSprints.find((s) => s._id === sprintId);
                    if (sprint) {
                      setSelectedSprint(sprint);
                    }
                  }
                }}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
