import { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/storyboard.css';
import { backendApi } from '../../api/backend';
import { TaskList } from '../TaskList';
import { ProjectRole } from '../project/ProjectForm';
import { UserStoryStatus } from '../project/UserStoryForm';
import { roundNumberToPointOne, toHours } from '../../utils/datetime';
import { ConfirmDialog } from './ConfirmDialog';
import { CommentConfirmDialog } from './CommentConfirmDialog';

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

const calculateTotalHours = (tasks) =>
  (tasks ?? []).reduce((total, task) => total + task.timeEstimation, 0);

const calculateTotalLoggedHours = (tasks) => {
  const allTimeLogEntries = (tasks ?? []).flatMap((task) => task.timeLogEntries ?? []);
  if (!allTimeLogEntries.length) {
    return 0;
  }
  return allTimeLogEntries.reduce(
    (total, tle) => total + (tle.type === 'manual' ? tle.time * 36e5 : tle.time),
    0,
  );
};

export const Storyboard = ({
  project,
  userStories = [],
  onEditStoryClick,
  currentSprint,
  columnConfiguration = defaultColumnConfiguration,
  currentUserRole,
  reloadUserStories,
}) => {
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveTask, setHasActiveTask] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [pendingUserStory, setPendingUserStory] = useState(null);
  const [isDenyCommentOpen, setIsDenyCommentOpen] = useState(false);
  const [denyComment, setDenyComment] = useState('');

  const getStatusColumnUserStories = (filters) => {
    const chainPredicates = getStoryPredicates(filters);
    return userStories.filter(chainPredicates);
  };

  const fetchTasks = async () => {
    if (!isExpanded) return;
    try {
      const response = await backendApi.get(`/tasks/${selectedUserStory._id}`);
      const { hasActiveTask, tasks } = response.data;
      setTasks(tasks);
      setHasActiveTask(hasActiveTask);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
    }
  };

  const canSeeBusinessValues = useMemo(
    () => currentUserRole !== ProjectRole.PRODUCT_OWNER,
    [currentUserRole],
  );

  const canMoveLeft = useCallback(
    (status) =>
      currentUserRole !== ProjectRole.PRODUCT_OWNER && !['backlog', 'done'].includes(status),
    [currentUserRole],
  );

  const canMoveRight = useCallback(
    (status) =>
      currentUserRole !== ProjectRole.PRODUCT_OWNER &&
      !['in_progress', 'review', 'done'].includes(status),
    [currentUserRole],
  );

  const isSprintView = columnConfiguration == defaultColumnConfiguration ? true : false;

  useEffect(() => {
    // fetchTasks();
  }, [isExpanded, selectedUserStory]);

  const handleCardClick = (userStory) => {
    if (selectedUserStory?._id === userStory._id) {
      setIsExpanded(!isExpanded);
    } else {
      setSelectedUserStory(userStory);
      setIsExpanded(true);
    }
  };

  const handleAcceptStory = async (projectId, storyId) => {
    try {
      console.log(storyId);
      await backendApi.patch(`/userStories/accept/${projectId}/${storyId}`);
      reloadUserStories?.();
    } catch (error) {
      console.error('Accept failed', error);
    }
  };

  const handleDenyStory = async (projectId, storyId, comment) => {
    try {
      await backendApi.patch(`/userStories/deny/${projectId}/${storyId}`, { comment });
      reloadUserStories?.();
      setIsDenyCommentOpen(false);
    } catch (error) {
      console.error('Reject failed', error);
    }
  };

  const handleDeleteStory = useCallback(async () => {
    try {
      const projectId = project._id;
      await backendApi.delete(`/userStories/${projectId}/${pendingUserStory}`);
      reloadUserStories?.();
      setPendingUserStory(null);
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Delete failed', error);
    }
  }, [project, pendingUserStory]);

  const handleMoveStory = async (projectId, storyId, direction) => {
    try {
      await backendApi.patch(`/userStories/move/${projectId}/${storyId}`, {
        direction,
      });
      reloadUserStories?.();
    } catch (error) {
      console.error('Move failed', error);
    }
  };

  const renderUserStoryCard = (userStory) => {
    const priorityClass = `priority-${userStory.priority}`;
    const typeIcon = getTypeIcon(userStory.type);

    const canEditAndDeleteUserStory =
      (currentUserRole === ProjectRole.PRODUCT_OWNER ||
        currentUserRole === ProjectRole.SCRUM_MASTER) &&
      !userStory.sprint &&
      userStory.status !== UserStoryStatus.DONE;

    const renderLoggedTime = () => {
      const totalLoggedHours = roundNumberToPointOne(
        toHours(calculateTotalLoggedHours(userStory.tasks ?? [])),
      );
      if (totalLoggedHours < 0.1) {
        return '';
      }
      return ` (${totalLoggedHours}h logged)`;
    };

    const showStoryPoints = canSeeBusinessValues && userStory.points > 0;
    return (
      <div
        key={userStory._id}
        className={`user-story-card ${priorityClass} ${isExpanded && selectedUserStory?._id === userStory._id ? 'expanded' : ''}`}
        onClick={() => handleCardClick(userStory)}
      >
        <div className="user-story-header">
          <span className="user-story-type">{typeIcon}</span>
          <div className="user-story-actions">
            {canEditAndDeleteUserStory && (
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
                  className="delete-user-story-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirmDeleteOpen(true);
                    setPendingUserStory(userStory._id);
                  }}
                >
                  🗑️
                </button>
              </div>
            )}

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
            tasks={userStory.tasks ?? []}
            userStoryId={userStory._id}
            onTasksUpdate={reloadUserStories}
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
          <span
            className={`user-story-points ${showStoryPoints ? 'user-story-points-background' : ''}`}
          >
            {showStoryPoints ? `${userStory.points} pts` : ''}
          </span>
          <span className="user-story-hours">
            {calculateTotalHours(userStory.tasks ?? [])}h {renderLoggedTime(userStory.tasks ?? [])}
          </span>
          {userStory.assignee && (
            <span className="user-story-assignee">
              {userStory.assignee.firstName} {userStory.assignee.lastName.charAt(0)}.
            </span>
          )}
          {!userStory.assignee && <span className="user-story-unassigned">Unassigned</span>}
        </div>
        <div className="acceptUserStory">
          <div className="review-buttons">
            {userStory.status === 'review' &&
              currentUserRole === ProjectRole.PRODUCT_OWNER &&
              isSprintView && (
                <button
                  className="accept-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptStory(project._id, userStory._id);
                  }}
                >
                  ✅ Accept
                </button>
              )}
            {userStory.status !== 'done' &&
              currentUserRole === ProjectRole.PRODUCT_OWNER &&
              isSprintView && (
                <button
                  className="deny-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingUserStory(userStory);
                    setIsDenyCommentOpen(true);
                  }}
                >
                  ❌ Reject
                </button>
              )}
          </div>
        </div>
        {isSprintView && (
          <div className="story-navigation">
            {canMoveLeft(userStory.status) && (
              <button
                className="arrow-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveStory(project._id, userStory._id, 'left');
                }}
                disabled={userStory.status === 'backlog'}
              >
                ◀️
              </button>
            )}

            {canMoveRight(userStory.status) && (
              <button
                className="arrow-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveStory(project._id, userStory._id, 'right');
                }}
                disabled={userStory.status === 'review'}
              >
                ▶️
              </button>
            )}
          </div>
        )}
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
        return '🧩';
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
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        message={'Are you sure you want to delete this user story?'}
        onConfirm={() => handleDeleteStory()}
        onCancel={() => {
          setPendingUserStory(null);
          setIsConfirmDeleteOpen(false);
        }}
      />

      <CommentConfirmDialog
        isOpen={isDenyCommentOpen}
        message={'Please provide a comment on why you are rejecting this story. '}
        comment={denyComment}
        setComment={setDenyComment}
        onConfirm={(comment) => {
          handleDenyStory(project._id, pendingUserStory._id, comment);
          setIsDenyCommentOpen(false);
          setDenyComment('');
        }}
        onCancel={() => {
          setPendingUserStory(null);
          setIsDenyCommentOpen(false);
          setDenyComment('');
        }}
      />
    </div>
  );
};
