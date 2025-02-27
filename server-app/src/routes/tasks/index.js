const Task = require('../../db/Task');
const auth = require('../../middleware/auth');

module.exports.mountTaskRoutes = app => {
  // Get all tasks for a sprint
  app.get('/api/v1/sprints/:sprintId/tasks', auth, async (req, res) => {
    try {
      const tasks = await Task.find({
        sprint: req.params.sprintId
      }).populate('assignee', 'username firstName lastName');
      
      res.json(tasks);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
};
