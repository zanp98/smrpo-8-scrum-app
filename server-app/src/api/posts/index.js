import express from 'express';
import { Post } from '../../db/Post.js';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired } from '../../middleware/auth.js';

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
    })
  );


// Get all posts for a project
postsRouter.get(
    '/:projectId',
    errorHandlerWrapped(async (req, res) => {
      const { projectId } = req.params;
  
      const posts = await Post.find({ project: projectId })
        .populate('author', 'name email')
        .sort({ createdAt: -1 });
  
      if (posts.length === 0) {
        return res.status(200).send("No posts yet for this project"); 
      }
  
      return res.status(200).json(posts);
    })
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
    })
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
    })
  );