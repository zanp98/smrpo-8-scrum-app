import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/v1/projects');
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

  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeProject) return;
      
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8000/api/v1/projects/${activeProject._id}/tasks`);
        setTasks(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tasks');
        setLoading(false);
      }
    };

    fetchTasks();
  }, [activeProject]);

  const handleProjectChange = (project) => {
    setActiveProject(project);
  };

  const getStatusColumnTasks = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const renderTaskCard = (task) => {
    const priorityClass = `priority-${task.priority}`;
    const typeIcon = getTypeIcon(task.type);
    
    return (
      <div key={task._id} className={`task-card ${priorityClass}`}>
        <div className="task-header">
          <span className="task-type">{typeIcon}</span>
          <span className="task-id">{activeProject?.key}-{task._id.substr(-4)}</span>
        </div>
        <div className="task-title">{task.title}</div>
        <div className="task-footer">
          <span className="task-points">{task.points > 0 ? `${task.points} pts` : ''}</span>
          <span className="task-assignee">
            {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName.charAt(0)}.` : 'Unassigned'}
          </span>
        </div>
      </div>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'story':
        return '📝';
      case 'bug':
        return '🐞';
      case 'epic':
        return '🏆';
      default:
        return '📋';
    }
  };

  if (loading && !activeProject) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">Scrum Management</div>
        <div className="user-info">
          <span>{currentUser?.firstName} {currentUser?.lastName}</span>
          <span className="user-role">{currentUser?.role.replace('_', ' ')}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </header>
      
      <div className="dashboard-content">
        <aside className="sidebar">
          <div className="projects-list">
            <h3>Projects</h3>
            {projects.length > 0 ? (
              <ul>
                {projects.map(project => (
                  <li 
                    key={project._id} 
                    className={activeProject?._id === project._id ? 'active' : ''}
                    onClick={() => handleProjectChange(project)}
                  >
                    {project.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No projects found</p>
            )}
          </div>
        </aside>
        
        <main className="main-content">
          {activeProject ? (
            <>
              <div className="project-header">
                <h2>{activeProject.name}</h2>
                <p>{activeProject.description}</p>
              </div>
              
              <div className="board-container">
                <div className="board-column">
                  <h3>Backlog</h3>
                  <div className="tasks-container">
                    {getStatusColumnTasks('backlog').map(renderTaskCard)}
                  </div>
                </div>
                
                <div className="board-column">
                  <h3>To Do</h3>
                  <div className="tasks-container">
                    {getStatusColumnTasks('todo').map(renderTaskCard)}
                  </div>
                </div>
                
                <div className="board-column">
                  <h3>In Progress</h3>
                  <div className="tasks-container">
                    {getStatusColumnTasks('in_progress').map(renderTaskCard)}
                  </div>
                </div>
                
                <div className="board-column">
                  <h3>Review</h3>
                  <div className="tasks-container">
                    {getStatusColumnTasks('review').map(renderTaskCard)}
                  </div>
                </div>
                
                <div className="board-column">
                  <h3>Done</h3>
                  <div className="tasks-container">
                    {getStatusColumnTasks('done').map(renderTaskCard)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="no-project">
              <h2>No project selected</h2>
              <p>Please select a project from the sidebar or create a new one.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
