import '../../styles/addStoriesToSprint.css';
import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { negate } from '../../utils/object';
import { calculateTotalStoryPoints } from '../../utils/sprint';

export const AddStoriesToSprint = ({ userStories = [], currentSprint, onAssign, onCloseClick }) => {
  const hasSprintAndIsNotCurrent = (userStory) => {
    return userStory.sprint?._id !== currentSprint?._id;
  };

  const isStoryEditable = (userStory) =>
    userStory.status !== 'done' &&
    userStory.points !== undefined &&
    userStory.businessValue !== undefined &&
    hasSprintAndIsNotCurrent(userStory);

  const currentSprintStoryPoints = useMemo(
    () => calculateTotalStoryPoints(userStories.filter(negate(hasSprintAndIsNotCurrent))),
    [userStories],
  );

  const assignableUserStories = userStories.filter(isStoryEditable);

  const [selectedUserStories, setSelectedUserStories] = useState([]);

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

  const selectedStoryPoints = useMemo(
    () =>
      calculateTotalStoryPoints(
        selectedUserStories.map((s) => assignableUserStories.find((t) => t._id === s)),
      ) + currentSprintStoryPoints,
    [selectedUserStories, currentSprintStoryPoints],
  );

  const handleAssign = () => {
    if (selectedStoryPoints > currentSprint.expectedVelocity) {
      toast.error('Selected velocity is greater than the sprint velocity!');
      return;
    }
    if (selectedUserStories.length > 0 && currentSprint) {
      onAssign?.(selectedUserStories, currentSprint);
      return;
    }
    toast.error('Please select at least one user story.');
  };

  return (
    <div className="assign-container">
      <h3 className="close" onClick={() => onCloseClick?.()}>
        ^
      </h3>
      <h2>Assign User Stories to Current Sprint</h2>
      <div
        className={selectedStoryPoints > currentSprint.expectedVelocity ? 'label-overbooked' : ''}
      >
        Selected {selectedStoryPoints}/{currentSprint.expectedVelocity}
      </div>
      <div className="dropdown">
        <label>User Stories:</label>
        <select multiple value={selectedUserStories} onChange={handleUserStoryChange}>
          {assignableUserStories.map((story) => (
            <option key={story._id} value={story._id} disabled={story.points === 0}>
              {story.number} {story.title} ({story.points})
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleAssign}>Assign</button>
    </div>
  );
};
