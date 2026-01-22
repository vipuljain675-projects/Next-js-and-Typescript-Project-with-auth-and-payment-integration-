const jwt = require("jsonwebtoken");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];

    // 🟢 RECTIFIED: Use the hardcoded string that matches authController.js exactly
// 🟢 RECTIFIED: Change this line in both files:
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user; 
    // 🟢 RECTIFIED: Explicitly set req.userId because hostController.js depends on it
    req.userId = user._id; 
    next();
  } catch (err) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};