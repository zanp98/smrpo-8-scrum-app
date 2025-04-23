import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { backendApi, getProjectUsers, startTimer, stopTimer } from '../api/backend';
import '../styles/task-list.css';
import TaskForm from './TaskForm';
import { AuthContext } from '../context/AuthContext';
import { TimeLogStopTimer } from './timelog/TimeLogStopTimer';

export const TaskList = ({
  tasks,
  loading,
  userStoryId,
  onTasksUpdate,
  userStorySprintId,
  currentSprintId,
  projectId,
  canStartTimer,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editBuffer, setEditBuffer] = useState({ description: '', timeEstimation: 0 });

  const { currentUser } = useContext(AuthContext);
  const hasActiveTask = useMemo(() => tasks?.find((t) => t.isActive), [tasks]);

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

  const handleUpdateTask = async (id, fields) => {
    try {
      await backendApi.patch(`/tasks/${id}`, fields);
      onTasksUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await backendApi.delete(`/tasks/${id}`);
      onTasksUpdate();
      setSelectedTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  const stopCurrentTaskTimer = useCallback(
    async (description = '') => {
      try {
        await stopTimer(isStoppingTimer, description);
        setIsStoppingTimer(false);
        onTasksUpdate();
      } catch (error) {
        console.error('Failed to stop current task:', error);
      }
    },
    [selectedTask, isStoppingTimer],
  );

  // --------------------------------------------------------------------------
  // Assign the selected task to the current user
  // --------------------------------------------------------------------------
  const handleAssignTaskToMe = async () => {
    if (!selectedTask) return;
    try {
      const currentUserId = currentUser.id;
      await handleUpdateTask(selectedTask._id, { assignedUser: currentUserId });

      setSelectedTask((prev) => ({
        ...prev,
        assignedUser: currentUser,
      }));
    } catch (error) {
      console.error('Failed to assign task to me:', error);
    }
  };

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

  const isTaskAssignedToTheCurrentUser = useCallback(
    (task) => {
      const result = [task.assignedUser?._id, task.assignedUser?.id].includes(currentUser.id);
      console.log(`${task.description}: ${result}`);
      return result;
    },
    [currentUser],
  );

  /* ───────── modal for a selected task ───────── */
  const renderTaskModal = () => {
    if (!selectedTask) return null;

    const closeModal = () => {
      setIsEditingTask(false);
      setSelectedTask(null);
    };

    const changeStatus = async (e) => {
      const newStatus = e.target.value;
      await handleUpdateTask(selectedTask._id, { status: newStatus });
      setSelectedTask((prev) => ({ ...prev, status: newStatus }));
    };

    // ───── Edit mode: only show form with labels ─────
    if (isEditingTask) {
      return ReactDOM.createPortal(
        <div className="task-modal-overlay" onClick={closeModal}>
          <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Task</h3>
            <label htmlFor="edit-desc">
              <strong>Description:</strong>
            </label>
            <input
              id="edit-desc"
              type="text"
              value={editBuffer.description}
              onChange={(e) => setEditBuffer((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
            <label htmlFor="edit-time">
              <strong>Time Estimation (h):</strong>
            </label>
            <input
              id="edit-time"
              type="number"
              min="0"
              value={editBuffer.timeEstimation}
              onChange={(e) =>
                setEditBuffer((prev) => ({
                  ...prev,
                  timeEstimation: Number(e.target.value),
                }))
              }
              required
            />
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={async () => {
                  await handleUpdateTask(selectedTask._id, {
                    description: editBuffer.description,
                    timeEstimation: editBuffer.timeEstimation,
                  });
                  setSelectedTask((prev) => ({
                    ...prev,
                    description: editBuffer.description,
                    timeEstimation: editBuffer.timeEstimation,
                  }));
                  setIsEditingTask(false);
                }}
              >
                Save
              </button>
              <button style={{ marginTop: '10px' }} onClick={() => setIsEditingTask(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body,
      );
    }

    // ───── Normal view: full details ─────
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
          <select
            id="status-select"
            value={selectedTask.status}
            onChange={changeStatus}
            disabled={
              !selectedTask.assignedUser ||
              ![selectedTask.assignedUser.id, selectedTask.assignedUser._id].includes(
                currentUser.id,
              )
            }
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          {/*TODO: Add input when the status is DONE */}
          {/*{selectedTask?.status === 'DONE' && ()}*/}
          {!selectedTask.assignedUser && (
            <button
              style={{ marginTop: '10px', marginRight: '10px' }}
              onClick={handleAssignTaskToMe}
            >
              Assign to Me
            </button>
          )}
          {(selectedTask.assignedUser?.id === currentUser.id ||
            selectedTask.assignedUser?._id === currentUser.id) && (
            <button style={{ marginTop: '10px', marginRight: '10px' }} onClick={handleRejectTask}>
              Reject Task
            </button>
          )}
          <button
            style={{ marginTop: '10px', marginRight: '10px' }}
            onClick={() => {
              setEditBuffer({
                description: selectedTask.description,
                timeEstimation: selectedTask.timeEstimation,
              });
              setIsEditingTask(true);
            }}
          >
            Edit Task
          </button>
          <button
            style={{ marginTop: '10px', marginRight: '10px' }}
            className={`delete-task-button ${Boolean(selectedTask.assignedUser) ? 'disabled' : ''}`}
            disabled={Boolean(selectedTask.assignedUser)}
            onClick={() => handleDeleteTask(selectedTask._id)}
          >
            Delete Task
          </button>
          <button style={{ marginTop: '10px', marginRight: '10px' }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>,
      document.body,
    );
  };

  /* ───────── early loading state ───────── */
  if (loading) return <div className="tasks-loading">Loading tasks...</div>;

  /* ───────── main render ───────── */
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
          {canStartTimer && !hasActiveTask && isTaskAssignedToTheCurrentUser(task) && (
            <button
              className="timer-button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await startTimer(task._id);
                  onTasksUpdate();
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              ▶️
            </button>
          )}
          {canStartTimer && task.isActive && isTaskAssignedToTheCurrentUser(task) && (
            <button
              className="timer-button"
              onClick={async (e) => {
                e.stopPropagation();
                setIsStoppingTimer(task._id);
              }}
            >
              ⏹️
            </button>
          )}
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

      {isStoppingTimer &&
        ReactDOM.createPortal(
          <div className="task-modal-overlay" onClick={() => setIsAddingTask(false)}>
            <div className="task-modal-content" onClick={(e) => e.stopPropagation()}>
              <TimeLogStopTimer
                stopTimer={(description) => stopCurrentTaskTimer(description)}
                close={() => setIsStoppingTimer(false)}
              />
            </div>
          </div>,
          document.body,
        )}

      {renderTaskModal()}
    </div>
  );
};
