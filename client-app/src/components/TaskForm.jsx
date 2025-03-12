import React, { useEffect, useState } from 'react';
import '../styles/task-form.css';

export const TaskType = Object.freeze({
  STORY: 'story',
  TASK: 'task',
  BUG: 'bug',
  EPIC: 'epic',
});

export const TaskStatus = Object.freeze({
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
});

// These will be mapped on the UI to:
// 'must have', 'could have', 'should have', 'won't have this time', 'won't do'
export const TaskPriority = Object.freeze({
  HIGHEST: 'highest',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  LOWEST: 'lowest',
});

export const TaskForm = ({ onSubmit, projectUsers = [], initialData, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    points: 0,
    businessValue: 0,
    assignee: null,
  });

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setFormData({
      title: initialData.title,
      description: initialData.description || '',
      type: initialData.type,
      status: initialData.status,
      priority: initialData.priority,
      points: initialData.points,
      businessValue: initialData.businessValue,
      assignee: initialData.assignee,
    });
  }, [initialData]);

  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title) {
      setError('Title is required');
      return;
    }

    const result = await onSubmit(formData);
    if (result) {
      setError(result);
    }
  };

  return (
    <div className="task-form-container">
      <h3 onClick={() => onClose()}>^</h3>
      <h3>{!!initialData ? 'Edit Task' : 'Create New Task'}</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            disabled={!!initialData}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" value={formData.type} onChange={handleChange}>
            <option value={TaskType.STORY}>Story</option>
            <option value={TaskType.TASK}>Task</option>
            <option value={TaskType.BUG}>Bug</option>
            <option value={TaskType.EPIC}>Epic</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value={TaskStatus.BACKLOG}>Backlog</option>
            <option value={TaskStatus.TODO}>To do</option>
            <option value={TaskStatus.IN_PROGRESS}>In progress</option>
            <option value={TaskStatus.REVIEW}>Review</option>
            <option value={TaskStatus.DONE}>Done</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
            <option value={TaskPriority.HIGHEST}>Must have</option>
            <option value={TaskPriority.HIGH}>Should have</option>
            <option value={TaskPriority.MEDIUM}>Could have</option>
            <option value={TaskPriority.LOW}>Won't have this time</option>
            <option value={TaskPriority.LOWEST}>Won't do</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="points">Points</label>
          <input
            type="number"
            id="points"
            name="points"
            min="0"
            value={formData.points}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="businessValue">Business value</label>
          <input
            type="number"
            id="businessValue"
            name="businessValue"
            min="0"
            max="100"
            value={formData.businessValue}
            onChange={handleChange}
          />
        </div>

        {projectUsers.length && (
          <div className="form-group">
            <label htmlFor="assignee">Assignee</label>
            <select id="assignee" name="assignee" value={formData.assignee} onChange={handleChange}>
              <option value=""></option>
              {projectUsers.map((pu) => (
                <option key={pu._id} value={pu._id}>
                  {pu.firstName} {pu.lastName} ({pu.username})
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="submit-btn">
          {!!initialData ? 'Update Task' : 'Create Task'}
        </button>
      </form>
    </div>
  );
};
