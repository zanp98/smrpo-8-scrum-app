import React, { useEffect, useMemo, useState } from 'react';
import '../styles/user-story-form.css';

export const UserStoryType = Object.freeze({
  STORY: 'story',
  TASK: 'task',
  BUG: 'bug',
  EPIC: 'epic',
});

export const UserStoryStatus = Object.freeze({
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
});

// These will be mapped on the UI to:
// 'must have', 'could have', 'should have', 'won't have this time', 'won't do'
export const UserStoryPriority = Object.freeze({
  HIGHEST: 'highest',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  LOWEST: 'lowest',
});

export const UserStoryForm = ({
  onSubmit,
  projectUsers = [],
  initialData,
  projectSprints = [],
  onClose,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    acceptanceTests: '',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    points: 0,
    businessValue: 0,
    assignee: null,
    sprintId: null,
  });

  const isEditMode = !!initialData;

  const sprintCanBeChanged = useMemo(
    () => formData?.status !== 'done' && formData?.points > 0,
    [formData],
  );

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setFormData({
      title: initialData.title,
      description: initialData.description || '',
      acceptanceTests: initialData.acceptanceTests || '',
      type: initialData.type,
      status: initialData.status,
      priority: initialData.priority,
      points: initialData.points,
      businessValue: initialData.businessValue,
      assignee: initialData.assignee?._id,
      sprintId: initialData.sprint?._id,
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
    <div className="user-story-form-container">
      <h3 onClick={() => onClose()}>^</h3>
      <h3>{!!initialData ? 'Edit UserStory' : 'Create New UserStory'}</h3>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="user-story-form">
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
            <option value={UserStoryType.STORY}>Story</option>
            <option value={UserStoryType.TASK}>UserStory</option>
            <option value={UserStoryType.BUG}>Bug</option>
            <option value={UserStoryType.EPIC}>Epic</option>
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
          <label htmlFor="acceptanceTests">Acceptance tests</label>
          <textarea
            id="acceptanceTests"
            name="acceptanceTests"
            value={formData.acceptanceTests}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value={UserStoryStatus.BACKLOG}>Backlog</option>
            <option value={UserStoryStatus.TODO}>To do</option>
            <option value={UserStoryStatus.IN_PROGRESS}>In progress</option>
            <option value={UserStoryStatus.REVIEW}>Review</option>
            <option value={UserStoryStatus.DONE}>Done</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
            <option value={UserStoryPriority.HIGHEST}>Must have</option>
            <option value={UserStoryPriority.HIGH}>Should have</option>
            <option value={UserStoryPriority.MEDIUM}>Could have</option>
            <option value={UserStoryPriority.LOW}>Won't have this time</option>
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
            min="1"
            max="10"
            value={formData.businessValue}
            onChange={handleChange}
          />
        </div>

        {/*{projectUsers.length && isEditMode && (*/}
        {/*  <div className="form-group">*/}
        {/*    <label htmlFor="assignee">Assignee</label>*/}
        {/*    <select id="assignee" name="assignee" value={formData.assignee} onChange={handleChange}>*/}
        {/*      <option value=""></option>*/}
        {/*      {projectUsers.map((pu) => (*/}
        {/*        <option key={pu.user._id} value={pu.user._id}>*/}
        {/*          {pu.user.firstName} {pu.user.lastName} ({pu.user.username})*/}
        {/*        </option>*/}
        {/*      ))}*/}
        {/*    </select>*/}
        {/*  </div>*/}
        {/*)}*/}

        {/*{projectSprints.length && isEditMode && (*/}
        {/*  <div className="form-group">*/}
        {/*    <label htmlFor="sprintId">*/}
        {/*      Sprint {sprintCanBeChanged ? '' : '(cannot change if no estimate or status done)'}*/}
        {/*    </label>*/}
        {/*    <select*/}
        {/*      id="sprintId"*/}
        {/*      name="sprintId"*/}
        {/*      value={formData.sprintId}*/}
        {/*      onChange={handleChange}*/}
        {/*      disabled={!sprintCanBeChanged}*/}
        {/*    >*/}
        {/*      <option value=""></option>*/}
        {/*      {projectSprints.map((ps) => (*/}
        {/*        <option key={ps._id} value={ps._id}>*/}
        {/*          {ps.name}*/}
        {/*        </option>*/}
        {/*      ))}*/}
        {/*    </select>*/}
        {/*  </div>*/}
        {/*)}*/}

        <button type="submit" className="submit-btn">
          {isEditMode ? 'Update UserStory' : 'Create UserStory'}
        </button>
      </form>
    </div>
  );
};
