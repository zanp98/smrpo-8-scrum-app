const jwt = require('jsonwebtoken');
const User = require('../../db/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports.mountAuthRoutes = app => {
  // Login route
  app.post("/api/v1/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({ message: "User does not exist" });
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: user._id,
          username: user.username,
          role: user.role 
        }, 
        JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });
};
