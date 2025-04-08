import { useEffect, useState } from 'react';
import '../../styles/storyboard.css';
import { backendApi } from '../../api/backend';
import { TaskList } from '../TaskList';

export const Storyboard = ({ project, userStories = [], onEditStoryClick, currentSprint }) => {
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);

  const getStatusColumnUserStories = (status) => {
    return userStories.filter((userStory) => userStory.status === status);
  };

  const fetchTasks = async () => {
    if (!isExpanded) return;
    try {
      console.log('selectedUserStory');
      console.log(selectedUserStory);
      const response = await backendApi.get(`/tasks/${selectedUserStory._id}`);
      console.log('response');
      console.log(response);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
    }
  };

  const calculateTotalHours = (tasks) =>
    tasks.reduce((total, task) => total + task.timeEstimation, 0);

  useEffect(() => {
    fetchTasks();
  }, [isExpanded]);

  const handleCardClick = (userStory) => {
    if (selectedUserStory?._id === userStory._id) {
      setIsExpanded(!isExpanded);
    } else {
      setSelectedUserStory(userStory);
      setIsExpanded(true);
    }
  };

  const renderUserStoryCard = (userStory) => {
    const priorityClass = `priority-${userStory.priority}`;
    const typeIcon = getTypeIcon(userStory.type);

    return (
      <div
        key={userStory._id}
        className={`user-story-card ${priorityClass} ${isExpanded && selectedUserStory?._id === userStory._id ? 'expanded' : ''}`}
        onClick={() => handleCardClick(userStory)}
      >
        <div className="user-story-header">
          <span className="user-story-type">{typeIcon}</span>
          <div className="user-story-actions">
            <button
              className="edit-user-story-btn"
              onClick={() => {
                setSelectedUserStory(userStory);
                onEditStoryClick?.(userStory);
              }}
            >
              ✏️
            </button>
            <span className="user-story-id">
              {project?.key}-{userStory.number}
            </span>
          </div>
        </div>
        {isExpanded && selectedUserStory?._id === userStory._id && (
          <TaskList
            tasks={tasks}
            userStoryId={userStory._id}
            onTasksUpdate={fetchTasks}
            userStorySprintId={userStory.sprint?._id}
            currentSprintId={currentSprint._id}
            projectId={project._id}
          />
        )}
        <div className="user-story-title">{userStory.title}</div>
        <div className="user-story-description">{userStory.description}</div>
        <div className="user-story-description">{userStory.acceptanceTests ?? ''}</div>
        <div className="user-story-sprint">{userStory.sprint ? userStory.sprint.name : ''}</div>
        <div className="user-story-footer">
          <span className="user-story-points">
            {userStory.points > 0 ? `${userStory.points} pts` : ''}
          </span>
          <span className="user-story-hours">{calculateTotalHours(tasks)}h</span>
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
    <div className="board-container">
      <div className="kanban-column">
        <h3>Backlog</h3>
        <div className="user-stories-container">
          {getStatusColumnUserStories('backlog').map(renderUserStoryCard)}
        </div>
      </div>

      <div className="kanban-column">
        <h3>To Do</h3>
        <div className="user-stories-container">
          {getStatusColumnUserStories('todo').map(renderUserStoryCard)}
        </div>
      </div>

      <div className="kanban-column">
        <h3>In Progress</h3>
        <div className="user-stories-container">
          {getStatusColumnUserStories('in_progress').map(renderUserStoryCard)}
        </div>
      </div>

      <div className="kanban-column">
        <h3>Review</h3>
        <div className="user-stories-container">
          {getStatusColumnUserStories('review').map(renderUserStoryCard)}
        </div>
      </div>

      <div className="kanban-column">
        <h3>Done</h3>
        <div className="user-stories-container">
          {getStatusColumnUserStories('done').map(renderUserStoryCard)}
        </div>
      </div>
    </div>
  );
};
