const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  homeId: { type: mongoose.Schema.Types.ObjectId, ref: "Home", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // The Guest
  homeName: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  price: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  guests: {
     adults: { type: Number, required: true },
     children: { type: Number, required: true },
     seniors: { type: Number, required: true }
  },
  // 🟢 NEW: Status Field
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Rejected', 'Cancelled'], 
    default: 'Pending' // All new bookings start here
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);