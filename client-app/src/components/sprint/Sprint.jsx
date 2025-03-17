import { useEffect, useState } from 'react';
import { Storyboard } from '../shared/Storyboard';
import { getSprintUserStories } from '../../api/backend';
import { useParams } from 'react-router';

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
      <Storyboard project={project} userStories={userStories} />
    </div>
  );
};
