import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { backendApi, getProjectUsers } from '../api/backend';
import '../styles/task-list.css';
import TaskForm from './TaskForm';

export const TaskList = ({
  tasks,
  loading,
  userStoryId,
  onTasksUpdate,
  userStorySprintId,
  currentSprintId,
  projectId,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    getProjectUsers(projectId)
      .then((result) => setUsers(result))
      .catch((err) => console.error(err));
  }, [projectId]);

  const getUserInitials = (user) => {
    console.log('user', user);
    if (!user) return '';
    const first = user.firstName?.[0]?.toUpperCase() || '';
    const last = user.lastName?.[0]?.toUpperCase() || '';
    return first + last;
  };

  const handleAddTask = async (task) => {
    try {
      await backendApi.post(`/tasks/${userStoryId}`, task);
      onTasksUpdate(); // refresh tasks
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await backendApi.patch(`/tasks/${taskId}`, { status: newStatus });
      onTasksUpdate();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleUpdateTask = async (taskId, updatedFields) => {
    try {
      await backendApi.patch(`/tasks/${taskId}`, updatedFields);
      onTasksUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (loading) {
    return <div className="tasks-loading">Loading tasks...</div>;
  }

  const renderTaskModal = () => {
    if (!selectedTask) return null; // no modal if no selected task

    const closeModal = () => setSelectedTask(null);

    const handleStatusChange = async (e) => {
      const newStatus = e.target.value;
      await handleUpdateTask(selectedTask._id, { status: newStatus });
      // Also update local copy so dropdown updates right away
      setSelectedTask({ ...selectedTask, status: newStatus });
    };

    return ReactDOM.createPortal(
      <div className="task-modal-overlay" onClick={closeModal}>
        <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
          <h3>{selectedTask.description}</h3>
          <p>
            <strong>Assigned to:</strong>{' '}
            {selectedTask.assignedUser
              ? `${selectedTask.assignedUser.firstName} ${selectedTask.assignedUser.lastName}`
              : 'Unassigned'}
          </p>
          <p>
            <strong>Time Estimation:</strong> {selectedTask.timeEstimation}h
          </p>
          <label htmlFor="status-select">
            <strong>Status:</strong>
          </label>
          <select id="status-select" value={selectedTask.status} onChange={handleStatusChange}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <button style={{ marginTop: '20px' }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div className="tasks-container" onClick={(e) => e.stopPropagation()}>
      <h4>Tasks</h4>
      {tasks.map((task) => (
        <div
          key={task._id}
          className="task-item"
          onClick={() => setSelectedTask(task)}
          style={{ cursor: 'pointer' }}
        >
          <div className="task-description">{task.description}</div>
          <div className="task-details">
            <span>{task.timeEstimation}h</span>
            {task.assignedUser ? (
              <div className="task-assigned-user">{getUserInitials(task.assignedUser)}</div>
            ) : (
              <div className="task-unassigned">UN</div>
            )}
          </div>
        </div>
      ))}

      {userStorySprintId === currentSprintId && (
        <button className="add-task-button" onClick={() => setIsAddingTask(true)}>
          + Add Task
        </button>
      )}

      {/* Render the "add task" form as a modal if desired, or inline: */}
      {isAddingTask &&
        ReactDOM.createPortal(
          <div className="task-modal-overlay" onClick={() => setIsAddingTask(false)}>
            <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Your TaskForm component; pass in `users` */}
              <TaskForm
                onSubmit={handleAddTask}
                onCancel={() => setIsAddingTask(false)}
                users={users}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* Render the selectedTask modal for editing details */}
      {renderTaskModal()}
    </div>
  );
};
