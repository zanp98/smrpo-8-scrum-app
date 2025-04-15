import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { backendApi, getProjectUsers } from '../api/backend';
import '../styles/task-list.css';
import TaskForm from './TaskForm';
import { AuthContext } from '../context/AuthContext';

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
  const { currentUser } = useContext(AuthContext);

  // Fetch project users once
  useEffect(() => {
    getProjectUsers(projectId)
      .then((result) => setUsers(result))
      .catch((err) => console.error(err));
  }, [projectId]);

  // Helper: returns "JD" for John Doe
  const getUserInitials = (user) => {
    if (!user) return '';
    const first = user.firstName?.[0]?.toUpperCase() || '';
    const last = user.lastName?.[0]?.toUpperCase() || '';
    return first + last;
  };

  // --------------------------------------------------------------------------
  // Create new task
  // --------------------------------------------------------------------------
  const handleAddTask = async (task) => {
    try {
      await backendApi.post(`/tasks/${userStoryId}`, task);
      onTasksUpdate(); // refresh tasks from parent
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsAddingTask(false);
    }
  };

  // --------------------------------------------------------------------------
  // Update existing task fields (like status, assignedUser, etc.)
  // --------------------------------------------------------------------------
  const handleUpdateTask = async (taskId, updatedFields) => {
    try {
      await backendApi.patch(`/tasks/${taskId}`, updatedFields);
      // Also tell the parent to refresh tasks
      onTasksUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // --------------------------------------------------------------------------
  // Assign the selected task to the current user
  // --------------------------------------------------------------------------
  const handleAssignTaskToMe = async () => {
    if (!selectedTask) return;
    try {
      const currentUserId = currentUser.id;
      await handleUpdateTask(selectedTask._id, { assignedUser: currentUserId });

      const me = users.find((u) => u._id === currentUserId);
      setSelectedTask((prev) => ({
        ...prev,
        assignedUser: currentUser,
      }));
    } catch (error) {
      console.error('Failed to assign task to me:', error);
    }
  };

  // --------------------------------------------------------------------------
  // Reject the task if I'm the assigned user
  // --------------------------------------------------------------------------
  const handleRejectTask = async () => {
    if (!selectedTask) return;
    try {
      await handleUpdateTask(selectedTask._id, { assignedUser: null });
      setSelectedTask((prev) => ({
        ...prev,
        assignedUser: null,
      }));
    } catch (error) {
      console.error('Failed to reject task:', error);
    }
  };

  // --------------------------------------------------------------------------
  // If loading
  // --------------------------------------------------------------------------
  if (loading) {
    return <div className="tasks-loading">Loading tasks...</div>;
  }

  // --------------------------------------------------------------------------
  // Render task details in a modal
  // --------------------------------------------------------------------------
  const renderTaskModal = () => {
    if (!selectedTask) return null;

    // Close the modal
    const closeModal = () => setSelectedTask(null);

    // Change the task's status in the DB and local state
    const handleStatusChange = async (e) => {
      const newStatus = e.target.value;
      await handleUpdateTask(selectedTask._id, { status: newStatus });
      // Also update the local selectedTask
      setSelectedTask((prev) => ({ ...prev, status: newStatus }));
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

          {/* Assign to me button */}
          {!selectedTask.assignedUser && (
            <button
              style={{ marginTop: '20px', marginRight: '10px' }}
              onClick={handleAssignTaskToMe}
            >
              Assign to Me
            </button>
          )}

          {/* Reject button (only if I'm the assigned user) */}
          {(selectedTask.assignedUser?.id === currentUser.id ||
            selectedTask.assignedUser?._id === currentUser.id) && (
            <button style={{ marginTop: '20px', marginRight: '10px' }} onClick={handleRejectTask}>
              Reject Task
            </button>
          )}

          <button style={{ marginTop: '20px' }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>,
      document.body,
    );
  };

  // --------------------------------------------------------------------------
  // Main render
  // --------------------------------------------------------------------------
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

      {currentSprintId && userStorySprintId === currentSprintId && (
        <button className="add-task-button" onClick={() => setIsAddingTask(true)}>
          + Add Task
        </button>
      )}

      {/* Add-Task Modal */}
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

      {renderTaskModal()}
    </div>
  );
};
