import { Project } from '../../db/Project.js';
import { ProjectRole } from '../../db/ProjectUserRole.js';
import express from 'express';
import { errorHandlerWrapped } from '../../middleware/error-handler.js';
import { projectRolesRequired, systemRolesRequired } from '../../middleware/auth.js';
import { UserRoles } from '../../db/User.js';
import { CAN_READ_PROJECTS } from '../../configuration/rolesConfiguration.js';
import { ProjectUserRole } from '../../db/ProjectUserRole.js';
import { getCaseInsensitiveRegex } from '../../utils/string-util.js';

export const projectsRouter = express.Router();

// Get project documentation
projectsRouter.get(
  '/:projectId/documentation',
  errorHandlerWrapped(async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await Project.findById(projectId, 'documentation');
      res.status(200).json(project.documentation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

// Update project documentation
projectsRouter.put(
  '/:projectId/documentation',
  errorHandlerWrapped(async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const { documentation } = req.body;

      console.log('documentation', documentation);

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      project.documentation = documentation;
      await project.save();

      res.status(200).json({ message: 'Project documentation updated', project });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

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

// Get all roles
projectsRouter.get(
  '/projectUserRoles',
  errorHandlerWrapped(async (req, res) => {
    try {
      const userId = req.user.id;
      const projectUserRoles = await ProjectUserRole.find({ user: userId }).populate(
        'project user',
      );
      res.status(200).json(projectUserRoles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

// Add a new project
projectsRouter.post(
  '/',
  systemRolesRequired(UserRoles.ADMIN), // Ensure only admins can create a project
  errorHandlerWrapped(async (req, res) => {
    try {
      const { name, key, description, members, owner } = req.body;

      if (!name || !key || !description) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check for duplicate project key
      const existingProject = await Project.findOne({
        $or: [{ name: { $regex: getCaseInsensitiveRegex(name) } }],
      });
      if (existingProject) {
        return res.status(400).json({ message: 'Project name already exists' });
      }

      // Extract member IDs
      const memberIds = (members ?? []).map((m) => m.user);
      const uniqueMembers = [...new Set([...memberIds, owner])]; // Ensure owner is included and no duplicates

      // Create the project
      const newProject = new Project({
        name,
        key,
        description,
        owner,
        members: uniqueMembers, // Ensure all members (including owner) are part of the project
      });

      await newProject.save();

      // Prepare roles for each member
      const projectUserRoles = [];

      // Ensure the project owner is assigned as ADMIN
      projectUserRoles.push({
        project: newProject._id,
        user: owner,
        role: ProjectRole.PRODUCT_OWNER,
      });

      (members ?? []).forEach(({ user, role }) => {
        if (projectUserRoles.find((pu) => pu.user === user)) {
          return;
        }
        projectUserRoles.push({
          project: newProject._id,
          user,
          role: role || ProjectRole.DEVELOPER, // Default to "developer" if no role is provided
        });
      });

      // Bulk insert roles into ProjectUserRole collection
      await ProjectUserRole.insertMany(projectUserRoles);

      res.status(201).json({ message: 'Project created successfully', project: newProject });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

//Get projects by userID
projectsRouter.get(
  '/projectsByUser',
  errorHandlerWrapped(async (req, res) => {
    try {
      const projects = await Project.find({
        members: req.user.id, // Find projects where user is a member
      })
        .populate('owner', 'username firstName lastName')
        .populate('sprint');

      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

//Update a project
projectsRouter.put(
  '/:projectId',
  errorHandlerWrapped(async (req, res) => {
    try {
      const { name, key, description, members } = req.body;
      const projectId = req.params.projectId;
      const userId = req.user.id; // Authenticated user

      let project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' }).populate('members', '_id');
      }

      // Check if the user is a Scrum Master for this project
      const userRole = await ProjectUserRole.findOne({ project: projectId, user: userId });

      const isScrumMaster = userRole && userRole.role === ProjectRole.SCRUM_MASTER;
      const isAdmin = req.user.role === ProjectRole.ADMIN;

      if (!isScrumMaster && !isAdmin) {
        return res
          .status(403)
          .json({ message: 'Only Scrum Masters or System Admins can update this project' });
      }

      // Check for duplicate project key
      if (key && key !== project.key) {
        const existingProject = await Project.findOne({ key });
        if (existingProject) {
          return res.status(400).json({ message: 'Project name already exists' });
        }
      }

      // Extract member IDs and roles
      const updatedMemberIds = members.map((m) => m.user);
      const existingMemberIds = project.members.filter(Boolean).map((m) => m.toString());

      // Find members to add and remove
      const membersToAdd = updatedMemberIds.filter((id) => !existingMemberIds.includes(id));
      const membersToRemove = existingMemberIds.filter((id) => !updatedMemberIds.includes(id));

      // Update project details
      project.name = name || project.name;
      project.key = key || project.key;
      project.description = description || project.description;
      project.members = updatedMemberIds; // Ensure correct member list

      await project.save();

      // Remove roles for deleted members
      await ProjectUserRole.deleteMany({ project: projectId, user: { $in: membersToRemove } });

      // Add new members to the project and set their roles in the ProjectUserRole table
      for (const memberId of membersToAdd) {
        // Add the new member to the project members array
        project.members.push(memberId);

        // Ensure the member has a role assigned
        const memberRole = members.find((m) => m.user.toString() === memberId).role;

        // Create the member's role in the ProjectUserRole table
        await ProjectUserRole.create({
          project: projectId,
          user: memberId,
          role: memberRole,
        });
      }

      // Update or add roles for existing members
      for (const { user, role } of members) {
        await ProjectUserRole.findOneAndUpdate(
          { project: projectId, user },
          { role },
          { upsert: true, new: true },
        );
      }

      res.json({ message: 'Project updated successfully', project });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

//Delete a project (also deletes entries for this project in ProjectUserRoles)
projectsRouter.delete(
  '/:projectId',
  systemRolesRequired(UserRoles.ADMIN),
  errorHandlerWrapped(async (req, res) => {
    try {
      const projectId = req.params.projectId;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Delete all related ProjectUserRole entries
      await ProjectUserRole.deleteMany({ project: projectId });

      //Delete the project itself
      await Project.findByIdAndDelete(projectId);

      res.json({ message: 'Project and related roles deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);

//Getting roles for a certain project (and user on project)
projectsRouter.get(
  '/users/:projectId/:userId?',
  projectRolesRequired(CAN_READ_PROJECTS),
  errorHandlerWrapped(async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const userId = req.params.userId;

      const findClause = {
        project: projectId,
        ...(userId ? { user: userId } : {}),
      };
      const projectUserRoles = await ProjectUserRole.find(findClause).populate(
        'user',
        'username firstName lastName id',
      );

      return res.status(200).json(projectUserRoles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }),
);
