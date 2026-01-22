const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // Not required for Google Users
  googleId: { type: String }, // New field for OAuth
  avatar: { type: String }    // Store Google profile pic
});

module.exports = mongoose.model('User', userSchema);