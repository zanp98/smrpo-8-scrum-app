import React, { useState } from 'react';
import { backendApi } from '../api/backend';
import '../styles/task-list.css';

export const TaskList = ({ tasks, loading, userStoryId, onTasksUpdate }) => {
  const [newTask, setNewTask] = useState({ description: '', timeEstimation: 0 });
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleAddTask = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await backendApi.post(`/tasks/${userStoryId}`, newTask);
      setNewTask({ description: '', timeEstimation: 0 });
      setIsAddingTask(false);
      onTasksUpdate();
    } catch (error) {
      console.error('Failed to add task:', error);
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
            <span>{task.timeEstimation}h</span>
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

      {isAddingTask ? (
        <form onSubmit={handleAddTask} className="add-task-form">
          <input
            type="text"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Task description"
            required
          />
          <input
            type="number"
            value={newTask.timeEstimation}
            onChange={(e) => setNewTask({ ...newTask, timeEstimation: Number(e.target.value) })}
            placeholder="Time (hours)"
            required
            min="0"
          />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setIsAddingTask(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button className="add-task-button" onClick={() => setIsAddingTask(true)}>
          + Add Task
        </button>
      )}
    </div>
  );
};
