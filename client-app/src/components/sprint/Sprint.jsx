import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Storyboard } from '../shared/Storyboard';
import { backendApi, getProjectUsers, getSprintUserStories, getProjectSprints, deleteSprint } from '../../api/backend';
import { useParams } from 'react-router';
import { calculateTotalStoryPoints } from '../../utils/stories';
import { SprintUserStoryForm } from './SprintUserStoryForm';
import { SprintEditForm } from './SprintEditForm';
import { AuthContext } from '../../context/AuthContext';
import { ProjectRole } from '../project/ProjectForm';

const CAN_EDIT_SPRINTS = [ProjectRole.SCRUM_MASTER];

export const Sprint = ({ project, sprint, setActiveProject, setActiveSprint }) => {
  const { currentUser } = useContext(AuthContext);
  const [ userStories, setUserStories] = useState([]);
  const [ counter, setCounter] = useState(0);
  const { projectId, sprintId } = useParams();
  const [showSprintEditForm, setShowSprintEditForm] = useState(false);
  const [selectedProjectSprints, setSelectedProjectSprints] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);

  if (project?._id !== projectId) {
    setActiveProject?.(projectId);
  }
  if (sprint?._id !== sprintId) {
    setActiveSprint?.(sprintId);
  }
  


  const currentUserRole = useMemo(() => {
    const projectUserRole = projectUsers.find((pu) => pu.user._id === currentUser.id);
    return projectUserRole?.role;
  }, [currentUser, projectUsers]);

  const hasRoleToEditSprint = useMemo(
    () => CAN_EDIT_SPRINTS.includes(currentUserRole),
    [currentUserRole]
  );

  useEffect(() => {
    const fetchProjectSprints = async () => {
      if (!project) {
        setSelectedProjectSprints([]);
        return;
      }
      const projectSprints = await getProjectSprints(project._id);
      setSelectedProjectSprints(projectSprints);
    };
  
    fetchProjectSprints();
  }, [project]);
  
  const currentSprint = selectedProjectSprints.find(s => s._id === sprintId);
  const isSprintStartDayPast = currentSprint?.startDate
    ? new Date(currentSprint.startDate) < new Date()
    : false;

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
      {hasRoleToEditSprint && !isSprintStartDayPast && (
        <div className="column-header">
          <button
            className="btn-general"
            onClick={() => {
              setShowSprintEditForm(true);
            }}
          >
            🛠 Edit a Sprint
          </button>
          <button
            className="btn-delete"
            onClick={async () => {
              const confirmed = window.confirm('Are you sure you want to delete this sprint?');
              if (!confirmed) return;
          
              try {
                console.log(sprintId);
                await deleteSprint(sprintId);
                alert('Sprint deleted successfully!');
                setActiveSprint(null); // Optional: clear current sprint
                setCounter((c) => c + 1); // or refresh stories/list if needed
              } catch (err) {
                alert('Failed to delete sprint.');
                console.error(err);
              }
            }}
          >
            ❌ Delete a Sprint
          </button>
        </div>
      )}

      {showSprintEditForm && (
        <SprintEditForm
          sprintId={sprintId}
          activeProjectId={projectId}
          onClose={() => setShowSprintEditForm(false)}
        />
      )}
      <br />
      {showEditUserStory && (
        <SprintUserStoryForm
          onSubmit={handleEditUserStory}
          initialData={selectedUserStory}
          onClose={() => {
            setShowEditUserStory(false);
          }}
          currentUserProjectRole={currentUserRole}
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
        reloadUserStories={() => setCounter((c) => c + 1)} 
      />
    </div>
  );
};
