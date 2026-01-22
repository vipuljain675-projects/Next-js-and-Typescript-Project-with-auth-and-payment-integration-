const mongoose = require('mongoose');

const homeSchema = new mongoose.Schema({
  houseName: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  rating: { type: Number, required: true },
  photoUrl: [{ type: String }],
  description: { type: String, required: true },
  amenities: { type: [String], default: [] },
  
  // 🟢 NEW: HOST AVAILABILITY DATES
  availableFrom: { type: Date, required: true },
  availableTo:   { type: Date, required: true },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Home', homeSchema);