import { useEffect, useState } from 'react';
import { backendApi } from '../api/backend';
import { UserStoryForm } from './UserStoryForm';
import '../styles/projects.css';

export const Projects = ({ activeProject }) => {
  const [userStories, setUserStories] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateUserStory, setShowCreateUserStory] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);

  const fetchProjectUsers = async () => {
    if (!activeProject) {
      return;
    }
    setLoading(true);
    try {
      const res = await backendApi.get(`/projects/users/${activeProject._id}`);
      setProjectUsers(res.data);
    } catch (error) {
      setError('Failed to project user data');
    } finally {
      setLoading(false);
    }
  };
  const fetchUserStories = async () => {
    if (!activeProject) {
      return;
    }

    try {
      setLoading(true);
      const res = await backendApi.get(`/userStories/${activeProject._id}`);
      setUserStories(res.data);
    } catch (err) {
      setError('Failed to fetch user stories');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUserStories();
    fetchProjectUsers();
  }, [activeProject]);

  const handleCreateUserStory = async (userStoryData) => {
    try {
      if (selectedUserStory) {
        // This is update
        await backendApi.patch(`/userStories/${activeProject._id}`, userStoryData);
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

  const getStatusColumnUserStories = (status) => {
    return userStories.filter((userStory) => userStory.status === status);
  };

  const renderUserStoryCard = (userStory) => {
    const priorityClass = `priority-${userStory.priority}`;
    const typeIcon = getTypeIcon(userStory.type);

    return (
      <div key={userStory._id} className={`user-story-card ${priorityClass}`}>
        <div className="user-story-header">
          <span className="user-story-type">{typeIcon}</span>
          <div className="user-story-actions">
            <button
              className="edit-user-story-btn"
              onClick={() => {
                setSelectedUserStory(userStory);
                setShowCreateUserStory(true);
              }}
            >
              ✏️
            </button>
            <span className="user-story-id">
              {activeProject?.key}-{userStory.number}
            </span>
          </div>
        </div>
        <div className="user-story-title">{userStory.title}</div>
        <div className="user-story-description">{userStory.description}</div>
        <div className="user-story-footer">
          <span className="user-story-points">
            {userStory.points > 0 ? `${userStory.points} pts` : ''}
          </span>
          {userStory.assignee && (
            <span className="user-story-assignee">
              {userStory.assignee.firstName} {userStory.assignee.lastName.charAt(0)}.
            </span>
          )}
          {!userStory.assignee && <span className="user-story-unassigned">Unassigned</span>}
        </div>
      </div>
    );
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'story':
        return '📝';
      case 'bug':
        return '🐞';
      case 'epic':
        return '🏆';
      default:
        return '📋';
    }
  };

  return (
    <main className="main-content">
      {activeProject ? (
        <>
          <div className="project-header">
            <h2>{activeProject.name}</h2>
            <p>{activeProject.description}</p>
          </div>
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
          </div>

          {showCreateUserStory && (
            <UserStoryForm
              onSubmit={handleCreateUserStory}
              projectUsers={projectUsers}
              initialData={selectedUserStory}
              onClose={() => {
                setShowCreateUserStory(false);
                setSelectedUserStory(null);
              }}
            />
          )}

          <div className="board-container">
            <div className="board-column">
              <h3>Backlog</h3>
              <div className="user-stories-container">
                {getStatusColumnUserStories('backlog').map(renderUserStoryCard)}
              </div>
            </div>

            <div className="board-column">
              <h3>To Do</h3>
              <div className="user-stories-container">
                {getStatusColumnUserStories('todo').map(renderUserStoryCard)}
              </div>
            </div>

            <div className="board-column">
              <h3>In Progress</h3>
              <div className="user-stories-container">
                {getStatusColumnUserStories('in_progress').map(renderUserStoryCard)}
              </div>
            </div>

            <div className="board-column">
              <h3>Review</h3>
              <div className="user-stories-container">
                {getStatusColumnUserStories('review').map(renderUserStoryCard)}
              </div>
            </div>

            <div className="board-column">
              <h3>Done</h3>
              <div className="user-stories-container">
                {getStatusColumnUserStories('done').map(renderUserStoryCard)}
              </div>
            </div>
          </div>
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
