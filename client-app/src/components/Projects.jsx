import { useContext, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router';
import { addStoriesToSprint, backendApi, getProjectUsers, getUserStories } from '../api/backend';
import { UserStoryForm } from './UserStoryForm';
import { Storyboard } from './shared/Storyboard';
import '../styles/projects.css';
import { AuthContext } from '../context/AuthContext';
import { isDateInFuture } from '../utils/datetime';
import { AddStoriesToSprint } from './shared/AddStoriesToSprint';

export const Projects = ({ activeProject, projectSprints, currentSprint }) => {
  const { currentUser } = useContext(AuthContext);

  const [userStories, setUserStories] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateUserStory, setShowCreateUserStory] = useState(false);
  const [showAddStoriesToSprint, setShowAddStoriesToSprint] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);

  const currentUserRole = useMemo(() => {
    const projectUserRole = projectUsers.find((pu) => pu.user._id === currentUser.id);
    return projectUserRole?.role;
  }, [currentUser, projectUsers]);

  const canCreateUserStories = useMemo(
    () => currentUserRole === 'scrum_master' || currentUserRole === 'admin',
    [currentUserRole],
  );

  const availableProjectSprints = useMemo(
    () => projectSprints?.filter((s) => isDateInFuture(s.endDate)),
    [projectSprints],
  );

  const fetchProjectUsers = async () => {
    if (!activeProject) {
      return;
    }
    setLoading(true);
    const projectUsers = await getProjectUsers(activeProject._id);
    setProjectUsers(projectUsers);
    setLoading(false);
  };

  const fetchUserStories = async () => {
    if (!activeProject) {
      return;
    }
    setLoading(true);
    const userStories = await getUserStories(activeProject._id);
    setUserStories(userStories);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserStories();
    fetchProjectUsers();
  }, [activeProject]);

  const handleCreateUserStory = async (userStoryData) => {
    try {
      if (selectedUserStory) {
        // This is update
        await backendApi.patch(
          `/userStories/${activeProject._id}/${selectedUserStory._id}`,
          userStoryData,
        );
      } else {
        // this is add
        await backendApi.post(`/userStories/${activeProject._id}`, userStoryData);
      }
      setShowCreateUserStory(false);
      fetchUserStories();
    } catch (err) {
      return err.response?.data?.message || 'Failed to create ticket';
    }
  };

  const handleAssignToSprint = async (selectedUserStories, selectedSprint) => {
    await addStoriesToSprint(selectedUserStories, selectedSprint, activeProject._id);
    fetchUserStories();
  };

  return (
    <main className="main-content">
      {activeProject ? (
        <>
          <div className="project-header">
            <h2>{activeProject.name}</h2>
            <p>{activeProject.description}</p>
          </div>
          {canCreateUserStories && (
            <div className="column-header">
              <button
                className="create-user-story-btn"
                onClick={() => {
                  setShowCreateUserStory(true);
                  setSelectedUserStory(null);
                }}
              >
                ➕ New UserStory
              </button>
              <button
                className="create-user-story-btn"
                onClick={() => {
                  setShowAddStoriesToSprint(true);
                  setSelectedUserStory(null);
                }}
              >
                🗒️ Add stories to sprint
              </button>
            </div>
          )}

          {showCreateUserStory && (
            <UserStoryForm
              onSubmit={handleCreateUserStory}
              projectUsers={projectUsers}
              projectSprints={availableProjectSprints}
              initialData={selectedUserStory}
              onClose={() => {
                setShowCreateUserStory(false);
                setSelectedUserStory(null);
              }}
            />
          )}
          {showAddStoriesToSprint && (
            <AddStoriesToSprint
              projectSprints={projectSprints}
              userStories={userStories}
              currentSprint={currentSprint}
              onCloseClick={() => setShowAddStoriesToSprint(false)}
              onAssign={(selectedUserStories, selectedSprint) =>
                handleAssignToSprint(selectedUserStories, selectedSprint)
              }
            />
          )}

          <Storyboard
            project={activeProject}
            userStories={userStories}
            onEditStoryClick={(userStory) => {
              setSelectedUserStory(userStory);
              setShowCreateUserStory(true);
            }}
          />
          <Outlet />
        </>
      ) : (
        <div className="no-project">
          <h2>No project selected</h2>
          <p>Please select a project from the sidebar or create a new one.</p>
        </div>
      )}
    </main>
  );
};
