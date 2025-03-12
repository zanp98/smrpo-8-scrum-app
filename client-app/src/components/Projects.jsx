import { useEffect, useState } from 'react';
import { backendApi } from '../api/backend';
import { TaskForm } from './TaskForm';
import '../styles/projects.css';

export const Projects = ({ activeProject }) => {
  const [tasks, setTasks] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchProjectUsers = async () => {
    if (!activeProject) {
      return;
    }
    setLoading(true);
    try {
      const res = await backendApi.get(`/projects/users/${activeProject._id}`);
      setProjectUsers(res.data);
    } catch (error) {
      setError('Failed to project user data');
    } finally {
      setLoading(false);
    }
  };
  const fetchTasks = async () => {
    if (!activeProject) {
      return;
    }

    try {
      setLoading(true);
      const res = await backendApi.get(`/tasks/${activeProject._id}`);
      setTasks(res.data);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTasks();
    fetchProjectUsers();
  }, [activeProject]);

  const handleCreateTask = async (taskData) => {
    try {
      if (selectedTask) {
        // This is update
        await backendApi.patch(`/tasks/${activeProject._id}`, taskData);
      } else {
        // this is add
        await backendApi.post(`/tasks/${activeProject._id}`, taskData);
      }
      setShowCreateTask(false);
      fetchTasks();
    } catch (err) {
      return err.response?.data?.message || 'Failed to create ticket';
    }
  };

  const getStatusColumnTasks = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const renderTaskCard = (task) => {
    const priorityClass = `priority-${task.priority}`;
    const typeIcon = getTypeIcon(task.type);

    return (
      <div key={task._id} className={`task-card ${priorityClass}`}>
        <div className="task-header">
          <span className="task-type">{typeIcon}</span>
          <div className="task-actions">
            <button
              className="edit-task-btn"
              onClick={() => {
                setSelectedTask(task);
                setShowCreateTask(true);
              }}
            >
              ✏️
            </button>
            <span className="task-id">
              {activeProject?.key}-{task.number}
            </span>
          </div>
        </div>
        <div className="task-title">{task.title}</div>
        <div className="task-description">{task.description}</div>
        <div className="task-footer">
          <span className="task-points">{task.points > 0 ? `${task.points} pts` : ''}</span>
          {task.assignee && (
            <span className="task-assignee">
              {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
            </span>
          )}
          {!task.assignee && <span className="task-unassigned">Unassigned</span>}
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

  return (
    <main className="main-content">
      {activeProject ? (
        <>
          <div className="project-header">
            <h2>{activeProject.name}</h2>
            <p>{activeProject.description}</p>
          </div>
          <div className="column-header">
            <button
              className="create-task-btn"
              onClick={() => {
                setShowCreateTask(true);
                setSelectedTask(null);
              }}
            >
              ➕ New Task
            </button>
          </div>

          {showCreateTask && (
            <TaskForm
              onSubmit={handleCreateTask}
              projectUsers={projectUsers}
              initialData={selectedTask}
              onClose={() => {
                setShowCreateTask(false);
                setSelectedTask(null);
              }}
            />
          )}

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
  );
};
