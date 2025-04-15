import React, { useState } from 'react';
import userForm from './UserForm';

const TaskForm = ({ onSubmit, onCancel, users }) => {
  const [task, setTask] = useState({ description: '', timeEstimation: 0, assignedUser: null });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask({ ...task, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task);
    setTask({ description: '', timeEstimation: 0, assignedUser: null });
  };

  return (
    <form onSubmit={handleSubmit} className="add-task-form">
      <input
        type="text"
        name="description"
        value={task.description}
        onChange={handleChange}
        placeholder="Task description"
        required
      />
      <input
        type="number"
        name="timeEstimation"
        value={task.timeEstimation}
        onChange={handleChange}
        placeholder="Time (hours)"
        required
        min="0"
      />
      <select name="assignedUser" value={task.assignedUser} onChange={handleChange}>
        <option value="">-- Select User --</option>
        {users.map((user) => (
          <option key={user.user._id} value={user.user._id}>
            {user.user.firstName} {user.user.lastName}
          </option>
        ))}
      </select>
      <button type="submit">Add</button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
};

export default TaskForm;
