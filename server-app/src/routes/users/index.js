const User = require('../../db/User');
const auth = require('../../middleware/auth');

module.exports.mountUserRoutes = app => {
  // Get all users
  app.get('/api/v1/users', auth, async (req, res) => {
    try {
      // Only admin can see all users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
};
