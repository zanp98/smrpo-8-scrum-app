import express from 'express';
import { Post } from '../../db/Post.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { ProjectUserRole } from '../../db/ProjectUserRole.js';

export const postsRouter = express.Router();

// Create a post on a project wall
postsRouter.post(
  '/',
  errorHandlerWrapped(async (req, res) => {
    const { content, project } = req.body;

    const author = req.user.id;

    if (!content || !project) {
      return res.status(400).json({ message: 'Content and project are required' });
    }

    const post = new Post({ content, author, project });
    await post.save();

    return res.status(201).json(post);
  }),
);

// Get all posts for a project
postsRouter.get(
  '/:projectId',
  errorHandlerWrapped(async (req, res) => {
    const { projectId } = req.params;

    const posts = await Post.find({ project: projectId })
      .populate('author', '_id name email')
      .populate('comments.author', 'email')
      .sort({ createdAt: -1 })
      .lean();

    const roles = await ProjectUserRole.find({ project: projectId });
    posts.forEach((post) => {
      const postRole = roles.find((r) => r.user.toString() === post.author._id.toString());
      if (postRole) {
        post.postRole = postRole.role;
      }
    });

    if (posts.length === 0) {
      return res.status(200).send('No posts yet for this project');
    }

    return res.status(200).json(posts);
  }),
);

// Delete a post (user can delete its posts, admin can delete anyones post)
postsRouter.delete(
  '/:postId',
  errorHandlerWrapped(async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.systemRole === 'admin';

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!isAdmin && post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    return res.status(200).json({ message: 'Post deleted successfully' });
  }),
);

//Update a post
postsRouter.patch(
  '/:postId',
  errorHandlerWrapped(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    post.content = content;
    await post.save();

    return res.status(200).json(post);
  }),
);

//add a comment to a post
postsRouter.post('/comments/:postId', async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const author = req.user.id;

    post.comments.push({ content, author});
    await post.save();

    res.status(201).json(post);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

postsRouter.delete('/comments/:postId/:commentId', async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Filter out the comment
    post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);

    await post.save();
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});