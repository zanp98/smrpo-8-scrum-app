import { useEffect, useState } from 'react';
import { backendApi } from '../api/backend';

export const Projects = ({ activeProject }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!activeProject) return;

      try {
        setLoading(true);
        const res = await backendApi.get(`/projects/${activeProject._id}/tasks`);
        setTasks(res.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tasks');
        setLoading(false);
      }
    };

    fetchTasks();
  }, [activeProject]);

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
          <span className="task-id">
            {activeProject?.key}-{task._id.substr(-4)}
          </span>
        </div>
        <div className="task-title">{task.title}</div>
        <div className="task-footer">
          <span className="task-points">{task.points > 0 ? `${task.points} pts` : ''}</span>
          <span className="task-assignee">
            {task.assignee
              ? `${task.assignee.firstName} ${task.assignee.lastName.charAt(0)}.`
              : 'Unassigned'}
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

  return (
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
  );
};
