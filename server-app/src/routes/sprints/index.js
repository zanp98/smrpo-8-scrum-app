const Sprint = require('../../db/Sprint');
const auth = require('../../middleware/auth');

module.exports.mountSprintRoutes = app => {
  // Get all sprints for a project
  app.get('/api/v1/projects/:projectId/sprints', auth, async (req, res) => {
    try {
      const sprints = await Sprint.find({
        project: req.params.projectId
      });
      
      res.json(sprints);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
};
