import { Project } from '../../db/Project.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { systemRolesRequired } from '../../middleware/auth.js';
import { User, UserRoles } from '../../db/User.js';

export const projectsRouter = express.Router();

// Get all projects
projectsRouter.get(
  '/',
  errorHandlerWrapped(async (req, res) => {
    try {
      const projects = await Project.find({
        members: req.user.id,
      }).populate('owner', 'username firstName lastName');

      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

// Add a new project
projectsRouter.post(
  '/', //add auth check if current member is admin
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { name, key, description, members } = req.body;
      const owner = req.user.id; // Get the authenticated user as the owner

      if (!name || !key || !description) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      //Check for duplicate project key
      const existingProject = await Project.findOne({ key });
      if (existingProject) {
        return res.status(400).json({ message: 'Project key already exists' });
      }

      const newProject = new Project({
        name,
        key,
        description,
        owner,
        members: members ? [...members, owner] : [owner], // Ensure owner is part of members
      });

      await newProject.save();

      res.status(201).json(newProject);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);


//Get projects by userID
projectsRouter.get(
  '/projectsByUser',
  errorHandlerWrapped(async (req, res) => {
    try {
      const projects = await Project.find({
        members: req.user.id, // Find projects where user is a member
      }).populate('owner', 'username firstName lastName');

      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  })
)

//Update a project
projectsRouter.put(
  '/:id',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    try {
      const { name, key, description, members } = req.body;
      const projectId = req.params.id;

      let project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Ensure only the owner can update the project
      if (project.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Check for duplicate project key
      if (key && key !== project.key) {
        const existingProject = await Project.findOne({ key });
        if (existingProject) {
          return res.status(400).json({ message: 'Project key already exists' });
        }
      }

      // Update project fields
      project.name = name || project.name;
      project.key = key || project.key;
      project.description = description || project.description;
      project.members = members || project.members;

      await project.save();

      res.json(project);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);


//Delete a project
projectsRouter.delete(
  '/:id',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    try {
      const projectId = req.params.id;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      await Project.findByIdAndDelete(projectId);

      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  })
);