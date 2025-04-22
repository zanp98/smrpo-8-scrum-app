import { useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useParams } from 'react-router';
import {
  addStoriesToSprint,
  backendApi,
  getProjectUsers,
  getUserStories,
  getProjectDocumentation,
  updateProjectDocumentation,
} from '../api/backend';
import { UserStoryForm, UserStoryPriority, UserStoryStatus } from './project/UserStoryForm';
import { SprintForm } from './sprint/SprintForm';
import { RolesEditForm } from './project/RolesEditForm';
import { Storyboard } from './shared/Storyboard';
import '../styles/projects.css';
import { AuthContext } from '../context/AuthContext';
import { AddStoriesToSprint } from './shared/AddStoriesToSprint';
import { ProjectRole } from './project/ProjectForm';
import ProjectDocumentationModal from './project/ProjectDocumentationModal';

const projectColumnConfiguration = [
  {
    name: 'Future releases',
    filters: {
      status: [UserStoryStatus.BACKLOG],
      priority: [UserStoryPriority.LOW],
    },
  },
  {
    name: 'Backlog',
    filters: {
      status: [UserStoryStatus.BACKLOG],
      priority: [UserStoryPriority.MEDIUM, UserStoryPriority.HIGH, UserStoryPriority.HIGHEST],
    },
  },
  {
    name: 'In Progress',
    filters: {
      status: [UserStoryStatus.TODO, UserStoryStatus.IN_PROGRESS, UserStoryStatus.REVIEW],
    },
  },
  {
    name: 'Finished',
    filters: {
      status: [UserStoryStatus.DONE],
    },
  },
];

const CAN_CREATE_STORIES = [ProjectRole.SCRUM_MASTER, ProjectRole.ADMIN, ProjectRole.PRODUCT_OWNER];

export const Projects = ({
  activeProject,
  projectSprints,
  currentSprint,
  onCreate,
  setSelectedProject,
}) => {
  const { currentUser } = useContext(AuthContext);
  const { projectId } = useParams();
  if (projectId) {
    setSelectedProject?.(projectId);
  }

  const [userStories, setUserStories] = useState([]);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUserStory, setShowCreateUserStory] = useState(false);
  const [showAddStoriesToSprint, setShowAddStoriesToSprint] = useState(false);
  const [selectedUserStory, setSelectedUserStory] = useState(null);
  const [showDocumentationModal, setShowDocumentationModal] = useState(false);
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [showRolesEditForm, setShowRolesEditForm] = useState(false);

  const [showProjectWall, setShowProjectWall] = useState(false);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPost, setEditingPost] = useState(null);
  const [projectDocumentation, setProjectDocumentation] = useState('');
  const [newComments, setNewComments] = useState({});

  const currentUserRole = useMemo(() => {
    const projectUserRole = projectUsers.find((pu) => pu.user._id === currentUser.id);
    return projectUserRole?.role;
  }, [currentUser, projectUsers]);

  const canCreateUserStories = useMemo(
    () => CAN_CREATE_STORIES.includes(currentUserRole),
    [currentUserRole],
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

  const fetchProjectDocumentation = async () => {
    console.log('fetching project documentation');
    if (!activeProject) return;
    const { data } = await getProjectDocumentation(activeProject._id);
    console.log(data);
    setProjectDocumentation(data);
  };

  const handleDocumentationSave = (content) => {
    updateProjectDocumentation(activeProject._id, content).then(() => {
      setProjectDocumentation(content);
    });
  };

  const fetchPosts = async () => {
    if (!activeProject) return;
    const { data } = await backendApi.get(`/posts/${activeProject._id}`);
    setPosts(Array.isArray(data) ? data : []);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    try {
      if (editingPost) {
        await backendApi.patch(`/posts/${editingPost._id}`, {
          content: newPostContent,
        });
      } else {
        await backendApi.post('/posts', {
          content: newPostContent,
          project: activeProject._id,
        });
      }

      setNewPostContent('');
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Failed to submit post:', error);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await backendApi.delete(`/posts/comments/${postId}/${commentId}`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  useEffect(() => {
    fetchUserStories();
    fetchProjectUsers();
    fetchPosts();
    fetchProjectDocumentation();
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

  const handleEditPost = (post) => {
    setEditingPost(post);
    setNewPostContent(post.content);
  };

  const handleDeletePost = async (postId) => {
    try {
      await backendApi.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleCommentInput = (postId, value) => {
    setNewComments((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const submitComment = async (postId) => {
    const commentText = newComments[postId];

    if (!commentText?.trim()) return; // Skip empty comments

    try {
      await backendApi.post(`/posts/comments/${postId}`, {
        content: commentText,
      });

      setNewPostContent('');
      setEditingPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Failed to submit post:', error);
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
          {canCreateUserStories && (
            <div className="column-header">
              <button
                className="btn-general"
                onClick={() => {
                  setShowRolesEditForm(true);
                }}
              >
                🔧 Edit a Project
              </button>
              <button
                className="btn-general"
                onClick={() => {
                  setShowSprintForm(true);
                }}
              >
                🏃 Add a Sprint
              </button>
              <button
                className="btn-general"
                onClick={() => {
                  setShowCreateUserStory(true);
                  setSelectedUserStory(null);
                }}
              >
                ➕ Add a User Story
              </button>
              {!!currentSprint && (
                <button
                  className="btn-general"
                  onClick={() => {
                    setShowAddStoriesToSprint(true);
                    setSelectedUserStory(null);
                  }}
                >
                  🗒️ Asign User Stories
                </button>
              )}
            </div>
          )}

          {showCreateUserStory && (
            <UserStoryForm
              onSubmit={handleCreateUserStory}
              initialData={selectedUserStory}
              onClose={() => {
                setShowCreateUserStory(false);
                setSelectedUserStory(null);
              }}
              currentUserProjectRole={currentUserRole}
            />
          )}
          {showAddStoriesToSprint && !!currentSprint && (
            <AddStoriesToSprint
              userStories={userStories}
              currentSprint={currentSprint}
              onCloseClick={() => setShowAddStoriesToSprint(false)}
              onAssign={(selectedUserStories, selectedSprint) =>
                handleAssignToSprint(selectedUserStories, selectedSprint)
              }
            />
          )}
          {showSprintForm && (
            <SprintForm
              onClose={() => setShowSprintForm(false)}
              onSprintCreate={() => onCreate?.()}
            />
          )}
          {showRolesEditForm && (
            <RolesEditForm
              activeProjectId={activeProject._id}
              onClose={() => setShowRolesEditForm(false)}
            />
          )}
          <ProjectDocumentationModal
            isOpen={showDocumentationModal}
            onClose={() => setShowDocumentationModal(false)}
            documentation={projectDocumentation}
            onSave={handleDocumentationSave}
            activeProject={activeProject}
          />

          <Storyboard
            project={activeProject}
            userStories={userStories}
            currentSprint={currentSprint}
            onEditStoryClick={(userStory) => {
              setSelectedUserStory(userStory);
              setShowCreateUserStory(true);
            }}
            columnConfiguration={projectColumnConfiguration}
            currentUserRole={currentUserRole}
            reloadUserStories={fetchUserStories}
          />

          <div className="project-wall-section">
            <button
              className="btn-general"
              style={{ width: '30vw' }}
              onClick={() => setShowProjectWall(!showProjectWall)}
            >
              🧱 Project Wall
            </button>

            <button
              className="btn-general"
              style={{ marginLeft: '20px', width: '30vw' }}
              onClick={() => setShowDocumentationModal(true)}
            >
              📄 User Documentation
            </button>

            {showProjectWall && (
              <section className="project-wall-container">
                <h3>📌 Project Wall</h3>

                <ul className="post-list">
                  {posts && posts.length > 0 ? (
                    posts.map((post) => {
                      const isAuthor = post.author?._id === currentUser.id;
                      const role = post.postRole;
                      const isAuthorOrScrumMaster =
                        post.author?._id === currentUser.id || currentUserRole == 'scrum_master';

                      let postClass = 'post-item';
                      if (role === 'product_owner') postClass += ' post-item-po';
                      else if (role === 'scrum_master') postClass += ' post-item-sm';

                      return (
                        <div>
                          <div key={post._id} className={`post-container`}>
                            <div className={`post-new ${postClass}`}>
                              <div className="post-header">
                                <strong>
                                  {post.author?.email || 'Unknown Author'} (
                                  {post.postRole || 'Unknown role'})
                                </strong>
                                <span>{new Date(post.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="post-content">{post.content}</p>
                              <div className="post-actions-row">
                                {isAuthor && (
                                  <button
                                    className="btn-post-actions"
                                    onClick={() => handleEditPost(post)}
                                  >
                                    ✏️
                                  </button>
                                )}
                                {isAuthorOrScrumMaster && (
                                  <button
                                    className="btn-post-actions"
                                    onClick={() => handleDeletePost(post._id)}
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            </div>

                            <div>
                              <div>
                                {post.comments && post.comments.length > 0 ? (
                                  post.comments.map((comment, i) => (
                                    <div key={i} className="comment">
                                      <div>
                                        <strong>{comment.author?.email || 'Anonymous'}:</strong>{' '}
                                        {comment.content}
                                      </div>

                                      <div>
                                        {new Date(comment.createdAt).toLocaleString()}
                                        {currentUserRole === 'scrum_master' && (
                                          <button
                                            className="btn-comment-actions"
                                            onClick={() => handleDeleteComment(post._id, comment._id)}
                                          >
                                            🗑️
                                          </button>)}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="no-comments">No comments yet.</div>
                                )}
                                <div className="comment-input-area">
                                  <textarea
                                    className="comment-textarea"
                                    placeholder="Write a comment..."
                                    rows={3}
                                    cols={60}
                                    onChange={(e) => handleCommentInput(post._id, e.target.value)}
                                  />
                                  <div>
                                    <button
                                      className="btn-general"
                                      style={{ width: '20vw' }}
                                      onClick={() => submitComment(post._id)}
                                    >
                                      Post Comment
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div></div>
                        </div>
                      );
                    })
                  ) : (
                    <p>No posts yet for this project. Be the first to post!</p>
                  )}
                </ul>

                <h3>Add a post</h3>
                <form className="post-form" onSubmit={handleCreatePost}>
                  <textarea
                    className="post-textarea"
                    rows={10}
                    cols={80}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What is on your mind?"
                  />
                  <button type="submit" style={{ width: '20vw' }}>
                    {editingPost ? 'Update Post' : 'Add Post'}
                  </button>
                  {editingPost && (
                    <button
                      type="button"
                      style={{ width: '20vw' }}
                      onClick={() => {
                        setEditingPost(null);
                        setNewPostContent('');
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </section>
            )}
          </div>
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
