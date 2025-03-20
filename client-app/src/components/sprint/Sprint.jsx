import { useEffect, useMemo, useState } from 'react';
import { Storyboard } from '../shared/Storyboard';
import { getSprintUserStories } from '../../api/backend';
import { useParams } from 'react-router';
import { calculateTotalStoryPoints } from '../../utils/sprint';

export const Sprint = ({ project, sprint, setActiveProject, setActiveSprint }) => {
  const [userStories, setUserStories] = useState([]);
  const { projectId, sprintId } = useParams();
  if (project?._id !== projectId) {
    setActiveProject?.(projectId);
  }
  if (sprint?._id !== sprintId) {
    setActiveSprint?.(sprintId);
  }

  const getUserStories = async (projectId, sprintId) => {
    const stories = await getSprintUserStories({ projectId, sprintId });
    setUserStories(stories);
  };

  const totalStoryPoints = useMemo(() => calculateTotalStoryPoints(userStories), [userStories]);

  useEffect(() => {
    if (!project || !sprint) {
      return;
    }
    getUserStories(project._id, sprint._id);
  }, [project, sprint]);

  if (!project || !sprint) {
    return;
  }
  return (
    <div className="main-content">
      <div>{sprint.name}</div>
      <div>Number of user stories: {userStories?.length ?? 0}</div>
      <div className={totalStoryPoints > sprint.expectedVelocity ? 'label-overbooked' : ''}>
        Velocity: {totalStoryPoints}/{sprint.expectedVelocity}
      </div>
      <br />
      <Storyboard project={project} userStories={userStories} />
    </div>
  );
};
