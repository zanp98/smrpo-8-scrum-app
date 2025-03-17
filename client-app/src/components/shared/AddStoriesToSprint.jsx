import '../../styles/addStoriesToSprint.css';
import { useState } from 'react';

export const AddStoriesToSprint = ({
  userStories = [],
  projectSprints = [],
  currentSprint,
  onAssign,
  onCloseClick,
}) => {
  const isStoryEditable = (userStory) =>
    userStory.status !== 'done' &&
    userStory.points !== undefined &&
    userStory.businessValue !== undefined &&
    userStory.sprint?.id !== currentSprint._id;

  const assignableUserStories = userStories.filter(isStoryEditable);

  const [selectedUserStories, setSelectedUserStories] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState('');

  const handleUserStoryChange = (e) => {
    const value = e.target.value;
    if (!value) {
      setSelectedUserStories([]);
      return;
    }
    setSelectedUserStories((curr) =>
      curr.includes(value) ? curr.filter((id) => id !== value) : [...curr, value],
    );
  };

  const handleSprintChange = (e) => {
    setSelectedSprint(e.target.value);
  };

  const handleAssign = () => {
    if (selectedUserStories.length > 0 && selectedSprint) {
      onAssign?.(selectedUserStories, selectedSprint);
    } else {
      alert('Please select at least one user story and a sprint.');
    }
  };

  return (
    <div className="assign-container">
      <h3 className="close" onClick={() => onCloseClick?.()}>
        ^
      </h3>
      <h2>Assign User Stories to Sprint</h2>
      <div className="dropdown">
        <label>User Stories:</label>
        <select multiple value={selectedUserStories} onChange={handleUserStoryChange}>
          {assignableUserStories.map((story) => (
            <option key={story._id} value={story._id}>
              {story.number} {story.title}
            </option>
          ))}
        </select>
      </div>
      <div className="dropdown">
        <label>Sprint:</label>
        <select value={selectedSprint} onChange={handleSprintChange}>
          <option value="">Select a sprint</option>
          {projectSprints.map((sprint) => (
            <option key={sprint._id} value={sprint._id}>
              {sprint.name} {sprint._id === currentSprint._id ? ' (current)' : ''}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleAssign}>Assign</button>
    </div>
  );
};
