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

  useEffect(() => {
    getProjectUsers(projectId)
      .then((result) => {
        setUsers(result);
      })
      .catch((err) => console.error(err));
  }, []);

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

  if (loading) {
    return <div className="tasks-loading">Loading tasks...</div>;
  }

  return (
    <div className="tasks-container" onClick={(e) => e.stopPropagation()}>
      <h4>Tasks</h4>
      {tasks.map((task) => (
        <div key={task._id} className="task-item">
          <div className="task-description">{task.description}</div>
          <div className="task-details">
            {/* Time */}
            <span>{task.timeEstimation}h</span>

            {/* Assigned User */}
            {task.assignedUser ? (
              <div className="task-assigned-user">
                {task.assignedUser.firstName} {task.assignedUser.lastName}
              </div>
            ) : (
              <div className="task-unassigned">Unassigned</div>
            )}

            {/* Status */}
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task._id, e.target.value)}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>
      ))}
      {userStorySprintId === currentSprintId && (
        <button className="add-task-button" onClick={() => setIsAddingTask(true)}>
          + Add Task
        </button>
      )}

      {/* Render the modal via a Portal when isAddingTask is true */}
      {isAddingTask &&
        ReactDOM.createPortal(
          <div className="task-modal-overlay" onClick={() => setIsAddingTask(false)}>
            <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
              <TaskForm
                onSubmit={handleAddTask}
                onCancel={() => setIsAddingTask(false)}
                users={users}
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
