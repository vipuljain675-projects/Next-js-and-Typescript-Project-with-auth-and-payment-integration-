const Home = require("../models/home");
const Booking = require("../models/booking");
const Favourite = require("../models/favourite");
const Review = require("../models/review");

// 🟢 HELPER: Safe user check for ALL protected routes
const requireUser = (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized - no user session" });
  }
  return true;
};

/* =========================
   1. HOME LIST & DETAILS
========================= */
exports.getHomeList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; 
    const skip = (page - 1) * limit;

    const totalHomes = await Home.countDocuments();
    const homes = await Home.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      homes: homes,
      hasNextPage: (skip + homes.length) < totalHomes
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Fetching homes failed" });
  }
};

exports.getHomeDetails = async (req, res) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId).populate("userId");
    if (!home) return res.status(404).json({ message: "Home not found" });

    // 🟢 FIXED: Include _id for frontend ownership check
    const reviews = await Review.find({ homeId })
      .populate("userId", "_id firstName lastName") 
      .sort({ date: -1 });

    return res.status(200).json({
      home,
      reviews
    });
  } catch (err) {
    return res.status(500).json({ message: "Fetching details failed" });
  }
};

/* =========================
   2. SEARCH
========================= */
exports.getSearchResults = async (req, res) => {
  try {
    const { location, checkIn, checkOut } = req.query;
    let searchFilter = {};

    if (location && location !== "Anywhere" && location.trim() !== "") {
      searchFilter.location = { $regex: location, $options: "i" };
    }

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const busyBookings = await Booking.find({
        status: { $in: ["Pending", "Confirmed"] },
        checkIn: { $lt: end },
        checkOut: { $gt: start }
      });
      const busyHomeIds = busyBookings.map(b => b.homeId.toString());
      searchFilter._id = { $nin: busyHomeIds };
    }

    const homes = await Home.find(searchFilter).sort({ _id: -1 });
    return res.status(200).json({ homes });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({ message: "Search failed" });
  }
};

/* =========================
   3. BOOKINGS
========================= */
exports.getBookings = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const bookings = await Booking.find({ userId: req.user._id })
      .populate("homeId")
      .sort({ createdAt: -1 });

    const formatted = bookings.map(b => {
      if (!b.homeId) return null;
      return {
        _id: b._id,
        homeName: b.homeId.houseName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        totalPrice: b.totalPrice,
        adults: b.guests?.adults || 1,
        children: b.guests?.children || 0,
        seniors: b.guests?.seniors || 0,
        createdAt: b.createdAt,
        user: { email: req.user.email }
      };
    }).filter(Boolean);

    return res.status(200).json({ bookings: formatted });
  } catch (err) {
    console.error("GET BOOKINGS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

exports.postBooking = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;

    const { homeId, checkIn, checkOut, adults, children, seniors } = req.body;
    const newCheckIn = new Date(checkIn);
    const newCheckOut = new Date(checkOut);

    if (newCheckIn >= newCheckOut) {
      return res.status(400).json({ 
        message: "Check-out date must be after the check-in date." 
      });
    }

    const conflict = await Booking.findOne({
      homeId,
      status: { $in: ["Pending", "Confirmed"] },
      checkIn: { $lt: newCheckOut },
      checkOut: { $gt: newCheckIn }
    });

    if (conflict) {
      return res.status(409).json({ message: "Dates Unavailable", homeId });
    }

    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).json({ message: "Home not found" });
    }

    const nights = Math.ceil((newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24)) || 1;

    const booking = new Booking({
      homeId,
      userId: req.user._id,
      homeName: home.houseName,
      checkIn: newCheckIn,
      checkOut: newCheckOut,
      totalPrice: nights * home.price,
      price: home.price,
      status: "Pending",
      guests: {
        adults: parseInt(adults) || 1,
        children: parseInt(children) || 0,
        seniors: parseInt(seniors) || 0
      }
    });

    await booking.save();
    return res.status(201).json({ message: "Booking successful", booking });
  } catch (err) {
    console.error("POST BOOKING ERROR:", err);
    return res.status(500).json({ message: "Booking failed" });
  }
};

exports.postCancelBooking = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID required" });
    }
    
    const result = await Booking.findOneAndUpdate(
      { _id: bookingId, userId: req.user._id }, 
      { status: "Cancelled" }
    );
    
    if (!result) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    return res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Cancellation failed" });
  }
};

/* =========================
   4. FAVOURITES
========================= */
exports.getFavouriteList = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const favourites = await Favourite.find({ userId: req.user._id }).populate("homeId");
    const homes = favourites.map(f => f.homeId).filter(Boolean);
    return res.status(200).json({ pageTitle: "My Wishlist", homes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Fetching wishlist failed" });
  }
};

exports.postAddToFavourite = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const { homeId } = req.body;
    if (!homeId) {
      return res.status(400).json({ message: "Home ID required" });
    }
    
    const exists = await Favourite.findOne({ userId: req.user._id, homeId });
    if (exists) return res.status(200).json({ message: "Already in wishlist" });
    
    await Favourite.create({ userId: req.user._id, homeId });
    return res.status(201).json({ message: "Added to wishlist" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Adding to wishlist failed" });
  }
};

exports.postRemoveFavourite = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const { homeId } = req.body;
    if (!homeId) {
      return res.status(400).json({ message: "Home ID required" });
    }
    
    await Favourite.findOneAndDelete({ userId: req.user._id, homeId });
    return res.status(200).json({ message: "Removed from wishlist" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Removing from wishlist failed" });
  }
};

/* =========================
   5. REVIEWS (FULLY PROTECTED)
========================= */
exports.postReview = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const { homeId, rating, comment } = req.body;
    
    // 🟢 VALIDATION
    const ratingNum = Number(rating);
    if (!homeId || !comment?.trim() || !Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Invalid review data" });
    }
    
    const review = new Review({ 
      homeId, 
      userId: req.user._id, 
      rating: ratingNum,
      comment, 
      date: new Date() 
    });
    await review.save();
    
    return res.status(201).json({ message: "Review added", review });
  } catch (err) {
    console.error("POST REVIEW ERROR:", err);
    return res.status(500).json({ message: "Adding review failed" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const { rating, comment } = req.body;
    const { reviewId } = req.params;
    
    const ratingNum = Number(rating);
    if (!comment?.trim() || !Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Invalid review data" });
    }

    const updatedReview = await Review.findOneAndUpdate(
      { _id: reviewId, userId: req.user._id },
      { rating: ratingNum, comment, date: new Date() },
      { new: true }
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    return res.status(200).json({ message: "Review updated successfully", updatedReview });
  } catch (err) {
    console.error("UPDATE REVIEW ERROR:", err);
    return res.status(500).json({ message: "Update failed" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    if (!requireUser(req, res)) return;
    
    const { reviewId } = req.params;

    const deletedReview = await Review.findOneAndDelete({ 
      _id: reviewId, 
      userId: req.user._id 
    });

    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("DELETE REVIEW ERROR:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};
