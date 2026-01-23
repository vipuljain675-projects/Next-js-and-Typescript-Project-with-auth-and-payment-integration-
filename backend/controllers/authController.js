const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

// Helper to generate Token
const generateToken = (user) => {
  return jwt.sign(
    { email: user.email, userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } 
  );
};

exports.getSignup = (req, res) => {
  res.status(200).json({ message: "Signup Endpoint" });
};

exports.postSignup = async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(422).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    const result = await user.save();
    const token = generateToken(result);

    res.status(201).json({
      message: "User created successfully",
      token: token,
      user: { _id: result._id, firstName, lastName, email },
      isLoggedIn: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed." });
  }
};

exports.getLogin = (req, res) => {
  res.status(200).json({ message: "Login Endpoint" });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Please log in with Google." });
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      isLoggedIn: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed." });
  }
};

exports.postLogout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully." });
};

// 🟢 MODIFIED: Dynamic Google Auth Callback Handler
exports.googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user);

    // 🟢 SMART SWITCH:
    // If running on Render, this environment variable exists and points to Vercel.
    // If running locally, it falls back to localhost.
    // NOTE: We check both CLIENT_URL and CLIENT_URL_API to be safe, defaulting to localhost.
    const frontendUrl = process.env.CLIENT_URL || process.env.CLIENT_URL_API || 'http://localhost:3000';
    
    // Redirect to /success with token and user data
    res.redirect(`${frontendUrl}/success?token=${token}&user=${encodeURIComponent(JSON.stringify({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar
    }))}`);
  } catch (err) {
    console.error("Google Auth Error:", err);
    
    // Dynamic error redirect as well
    const frontendUrl = process.env.CLIENT_URL || process.env.CLIENT_URL_API || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
};