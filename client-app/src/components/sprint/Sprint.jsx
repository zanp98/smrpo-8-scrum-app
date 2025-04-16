import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Storyboard } from '../shared/Storyboard';
import { backendApi, getProjectUsers, getSprintUserStories } from '../../api/backend';
import { useParams } from 'react-router';
import { calculateTotalStoryPoints } from '../../utils/stories';
import { SprintUserStoryForm } from './SprintUserStoryForm';
import { AuthContext } from '../../context/AuthContext';

export const Sprint = ({ project, sprint, setActiveProject, setActiveSprint }) => {
  const { currentUser } = useContext(AuthContext);
  const [userStories, setUserStories] = useState([]);
  const [counter, setCounter] = useState(0);
  const { projectId, sprintId } = useParams();
  const [showSprintEditForm, setShowSprintEditForm] = useState(false);

  if (project?._id !== projectId) {
    setActiveProject?.(projectId);
  }
  if (sprint?._id !== sprintId) {
    setActiveSprint?.(sprintId);
  }
  const [projectUsers, setProjectUsers] = useState([]);

  const currentUserRole = useMemo(() => {
    const projectUserRole = projectUsers.find((pu) => pu.user._id === currentUser.id);
    return projectUserRole?.role;
  }, [currentUser, projectUsers]);

  const [showEditUserStory, setShowEditUserStory] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);

  const getUserStories = async (projectId, sprintId) => {
    const stories = await getSprintUserStories({ projectId, sprintId });
    setUserStories(stories);
  };

  const totalStoryPoints = useMemo(() => calculateTotalStoryPoints(userStories), [userStories]);

  const handleEditUserStory = useCallback(
    async (userStoryData) => {
      try {
        await backendApi.patch(
          `/userStories/${project._id}/${selectedUserStory._id}`,
          userStoryData,
        );
        setShowEditUserStory(false);
        setCounter((c) => c + 1);
      } catch (err) {
        return err.response?.data?.message || 'Failed to create ticket';
      }
    },
    [selectedUserStory, project],
  );

  const fetchProjectUsers = async (projectId) => {
    const projectUsers = await getProjectUsers(projectId);
    setProjectUsers(projectUsers);
  };

  useEffect(() => {
    if (!project || !sprint) {
      return;
    }
    getUserStories(project._id, sprint._id);
    fetchProjectUsers(project._id);
  }, [project, sprint, counter]);

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
      <button
        className="btn-general"
        onClick={() => {
          setShowSprintEditForm(true);
        }}
      >
        🛠 Edit a Sprint
      </button>
      <br />
      {showEditUserStory && (
        <SprintUserStoryForm
          onSubmit={handleEditUserStory}
          initialData={selectedUserStory}
          onClose={() => {
            setShowEditUserStory(false);
          }}
        />
      )}
      <Storyboard
        project={project}
        userStories={userStories}
        currentSprint={sprint}
        onEditStoryClick={(userStory) => {
          setSelectedUserStory(userStory);
          setShowEditUserStory(true);
        }}
        currentUserRole={currentUserRole}
      />
    </div>
  );
};
