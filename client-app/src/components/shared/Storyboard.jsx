import { useEffect, useState } from 'react';
import '../../styles/storyboard.css';
import { backendApi } from '../../api/backend';
import { TaskList } from '../TaskList';
import { ProjectRole } from '../project/ProjectForm';
import { UserStoryStatus } from '../project/UserStoryForm';

const defaultColumnConfiguration = [
  {
    name: 'Backlog',
    filters: { status: [UserStoryStatus.BACKLOG] },
  },
  {
    name: 'To Do',
    filters: { status: [UserStoryStatus.TODO] },
  },
  {
    name: 'In Progress',
    filters: { status: [UserStoryStatus.IN_PROGRESS] },
  },
  {
    name: 'Review',
    filters: { status: [UserStoryStatus.REVIEW] },
  },
  {
    name: 'Done',
    filters: { status: [UserStoryStatus.DONE] },
  },
];

const getStoryPredicates = (filters) => {
  const predicates = Object.entries(filters).map(
    ([k, v]) =>
      (userStory) =>
        v.includes(userStory?.[k]),
  );
  return (userStory) => predicates.every((predicate) => predicate(userStory));
};

export const Storyboard = ({
  project,
  userStories = [],
  onEditStoryClick,
  currentSprint,
  columnConfiguration = defaultColumnConfiguration,
  currentUserRole,
}) => {
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);

  const getStatusColumnUserStories = (filters) => {
    const chainPredicates = getStoryPredicates(filters);
    return userStories.filter(chainPredicates);
  };

  const fetchTasks = async () => {
    if (!isExpanded) return;
    try {
      const response = await backendApi.get(`/tasks/${selectedUserStory._id}`);
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
  }, [isExpanded, selectedUserStory]);

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
              onClick={(event) => {
                event.stopPropagation();
                onEditStoryClick?.(userStory);
              }}
            >
              ✏️
            </button>
            <button
              className="edit-user-story-btn"
              onClick={() => {
                setSelectedUserStory(userStory);
              }}
            >
              📋
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
            currentSprintId={currentSprint?._id}
            projectId={project._id}
            canStartTimer={
              userStory.status === 'in_progress' && currentUserRole === ProjectRole.DEVELOPER
            }
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
      {columnConfiguration.map((cc) => (
        <div className="kanban-column" key={cc.name}>
          <h3>{cc.name}</h3>
          <div className="user-stories-container">
            {getStatusColumnUserStories(cc.filters).map(renderUserStoryCard)}
          </div>
        </div>
      ))}
    </div>
  );
};
