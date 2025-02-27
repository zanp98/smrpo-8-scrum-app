const Project = require('../../db/Project');
const auth = require('../../middleware/auth');

module.exports.mountProjectRoutes = app => {
  // Get all projects
  app.get('/api/v1/projects', auth, async (req, res) => {
    try {
      const projects = await Project.find({
        members: req.user.id
      }).populate('owner', 'username firstName lastName');
      
      res.json(projects);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
};
