import bcrypt from 'bcryptjs';
import { connectMongo } from '../db/connectMongo.js';
import { User, UserRoles } from '../db/User.js';
import { Project } from '../db/Project.js';
import { Sprint } from '../db/Sprint.js';
import { ProjectUserRole, ProjectRole } from '../db/ProjectUserRole.js';
import { UserStory } from '../db/UserStory.js';
import { Task } from '../db/Task.js';
import { LoginAttempt } from '../db/LoginAttempt.js';

export const seed = async () => {
  try {
    const { MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_HOST = 'mongo', MONGO_PORT } = process.env;
    await connectMongo(MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_HOST, MONGO_PORT);

    // 1. Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Sprint.deleteMany({});
    await UserStory.deleteMany({});
    await ProjectUserRole.deleteMany({});
    await Task.deleteMany({});
    await LoginAttempt.deleteMany({});

    console.log('Creating users...');

    // 2. Create users
    const users = await User.insertMany([
      {
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@scrumapp.com',
        systemRole: UserRoles.ADMIN,
        role: ProjectRole.ADMIN,
      },
      {
        username: 'po_user',
        password: await bcrypt.hash('po123', 10),
        firstName: 'Product',
        lastName: 'Owner',
        email: 'po@scrumapp.com',
        systemRole: UserRoles.ADMIN,
        role: ProjectRole.PRODUCT_OWNER,
      },
      {
        username: 'sm_user',
        password: await bcrypt.hash('sm123', 10),
        firstName: 'Scrum',
        lastName: 'Master',
        email: 'sm@scrumapp.com',
        systemRole: UserRoles.ADMIN,
        role: ProjectRole.SCRUM_MASTER,
      },
      {
        username: 'dev1',
        password: await bcrypt.hash('dev123', 10),
        firstName: 'John',
        lastName: 'Developer',
        email: 'john@scrumapp.com',
        systemRole: UserRoles.USER,
        role: ProjectRole.DEVELOPER,
      },
      {
        username: 'dev2',
        password: await bcrypt.hash('dev123', 10),
        firstName: 'Jane',
        lastName: 'Coder',
        email: 'jane@scrumapp.com',
        systemRole: UserRoles.USER,
        role: ProjectRole.DEVELOPER,
      },
    ]);

    console.log(`Successfully created ${users.length} users!`);

    // 3. Create projects
    console.log('Creating projects...');

    const projects = await Project.insertMany([
      {
        name: 'Scrum Management App',
        key: 'SCRUM',
        description: 'A tool for managing Scrum projects',
        owner: users[1]._id, // Product Owner
        members: users.map((user) => user._id),
      },
      {
        name: 'E-commerce Platform',
        key: 'ECOM',
        description: 'Online shopping platform',
        owner: users[1]._id, // Product Owner
        members: [users[0]._id, users[2]._id, users[3]._id],
      },
    ]);

    console.log(`Successfully created ${projects.length} projects!`);

    // 4. Create ProjectUserRoles
    console.log('Creating project-user roles...');

    const allProjectUserRoles = [];
    for (const project of projects) {
      for (const user of users) {
        allProjectUserRoles.push({
          project: project._id,
          user: user._id,
          role: user.role,
        });
      }
    }
    const projectUserRoles = await ProjectUserRole.insertMany(allProjectUserRoles);
    console.log(`Successfully created ${projectUserRoles.length} projects-user roles!`);

    // 5. Create sprints
    console.log('Creating sprints...');

    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fourWeeksFromNow = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const sprints = await Sprint.insertMany([
      {
        name: 'Sprint 1',
        project: projects[0]._id,
        startDate: twoWeeksAgo,
        endDate: now,
        goal: 'Set up basic project structure',
        status: 'completed',
        expectedVelocity: 50,
      },
      {
        name: 'Sprint 2',
        project: projects[0]._id,
        startDate: now,
        endDate: twoWeeksFromNow,
        goal: 'Implement core features',
        status: 'active',
        expectedVelocity: 22,
      },
      {
        name: 'Sprint 3',
        project: projects[0]._id,
        startDate: twoWeeksFromNow,
        endDate: fourWeeksFromNow,
        goal: 'Finalize MVP',
        status: 'planning',
        expectedVelocity: 30,
      },
    ]);

    console.log(`Successfully created ${sprints.length} sprints!`);

    // 6. Create user stories
    console.log('Creating user stories...');
    const user_stories = await UserStory.insertMany([
      // Sprint 1 (completed)
      {
        title: 'Set up project repository',
        description: 'Create GitHub repository and set up initial project structure',
        type: 'task',
        status: 'done',
        priority: 'high',
        points: 3,
        assignee: users[3]._id, // John Developer
        reporter: users[2]._id, // Scrum Master
        project: projects[0]._id,
        sprint: sprints[0]._id,
        number: 1,
      },
      {
        title: 'Design database schema',
        description: 'Create initial database models and relationships',
        type: 'task',
        status: 'done',
        priority: 'high',
        points: 5,
        assignee: users[4]._id, // Jane Coder
        reporter: users[2]._id, // Scrum Master
        project: projects[0]._id,
        sprint: sprints[0]._id,
        number: 2,
      },

      // Sprint 2 (active)
      {
        title: 'Implement user authentication',
        description: 'Create login, registration and authentication middleware',
        type: 'story',
        status: 'in_progress',
        priority: 'highest',
        points: 8,
        assignee: users[3]._id, // John Developer
        reporter: users[1]._id, // Product Owner
        project: projects[0]._id,
        sprint: sprints[1]._id,
        number: 3,
      },
      {
        title: 'Create dashboard UI',
        description: 'Design and implement the main dashboard interface',
        type: 'story',
        status: 'todo',
        priority: 'high',
        points: 5,
        assignee: users[4]._id, // Jane Coder
        reporter: users[1]._id, // Product Owner
        project: projects[0]._id,
        sprint: sprints[1]._id,
        number: 4,
      },
      {
        title: 'Fix navigation bug',
        description: 'Navigation menu disappears on mobile devices',
        type: 'bug',
        status: 'todo',
        priority: 'medium',
        points: 3,
        assignee: users[4]._id, // Jane Coder
        reporter: users[2]._id, // Scrum Master
        project: projects[0]._id,
        sprint: sprints[1]._id,
        number: 5,
      },

      // Backlog (no sprint)
      {
        title: 'Implement sprint planning feature',
        description: 'Create interface for planning sprints and assigning user stories',
        type: 'story',
        status: 'backlog',
        priority: 'medium',
        points: 13,
        reporter: users[1]._id, // Product Owner
        project: projects[0]._id,
        number: 6,
      },
      {
        title: 'Add reporting capabilities',
        description: 'Create burndown charts and sprint reports',
        type: 'story',
        status: 'backlog',
        priority: 'low',
        points: 8,
        reporter: users[1]._id, // Product Owner
        project: projects[0]._id,
        number: 7,
      },
    ]);

    console.log(`Successfully created ${user_stories.length} user stories.`);

    // 7. Create tasks - ensuring each user story has at least one
    console.log('Creating tasks...');

    // We'll seed some existing tasks (as before) plus a new one for every user story
    const baseTasks = [
      {
        description: 'Set up development environment',
        timeEstimation: 4,
        assignedUser: users[3]._id,
        userStory: user_stories[0]._id, // Story #1
        status: 'DONE',
      },
      {
        description: 'Create initial project structure',
        timeEstimation: 2,
        assignedUser: users[4]._id,
        userStory: user_stories[0]._id, // Story #1
        status: 'DONE',
      },
      {
        description: 'Implement login form',
        timeEstimation: 6,
        assignedUser: users[3]._id,
        userStory: user_stories[2]._id, // Story #3
        status: 'IN_PROGRESS',
      },
      {
        description: 'Set up authentication middleware',
        timeEstimation: 8,
        assignedUser: users[4]._id,
        userStory: user_stories[2]._id, // Story #3
        status: 'TODO',
      },
    ];

    const extraTasks = [];
    user_stories.forEach((us) => {
      const alreadyHasTask = baseTasks.some((t) => t.userStory.toString() === us._id.toString());
      if (!alreadyHasTask) {
        extraTasks.push({
          description: `Auto-generated task for user story #${us.number}`,
          timeEstimation: 3,
          assignedUser: users[3]._id, // dev1, for example
          userStory: us._id,
          status: 'TODO',
        });
      }
    });

    const allTasksToInsert = [...baseTasks, ...extraTasks];
    const tasks = await Task.insertMany(allTasksToInsert);
    console.log(`Successfully created ${tasks.length} tasks!`);

    // 8. Update each UserStory with only its own tasks
    console.log('Linking tasks to their user stories...');
    for (const us of user_stories) {
      const tasksForStory = tasks.filter((t) => t.userStory.toString() === us._id.toString());
      if (tasksForStory.length > 0) {
        // If your UserStory schema has tasks: [{ type: ObjectId, ref: 'Task' }]
        // you can store them in the userStory doc. Otherwise, skip this step.
        await UserStory.findByIdAndUpdate(us._id, {
          $set: { tasks: tasksForStory.map((t) => t._id) },
        });
      }
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
};

seed()
  .then(() => console.log('Seed running successfully!'))
  .catch((error) => console.error(error));
