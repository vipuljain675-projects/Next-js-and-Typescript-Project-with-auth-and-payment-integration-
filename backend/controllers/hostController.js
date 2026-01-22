const Home = require("../models/home");
const Booking = require("../models/booking");
const sendEmail = require('../utils/email'); // Import your new utility

/* =========================
   1. HOST ENTRY POINT
========================= */

exports.getHostDashboard = (req, res, next) => {
  // Use req.userId set by the rectified is-auth middleware
  if (!req.userId) {
    return res.status(200).json({
      pageTitle: "Become a Host",
      currentPage: "host-landing",
      isAuthenticated: false
    });
  }

  // If logged in, check if they have homes
  Home.find({ userId: req.userId })
    .then(homes => {
      res.status(200).json({
        homes: homes,
        hasHomes: homes.length > 0,
        redirectTo: homes.length === 0 ? "/host/add-home" : "/host/host-home-list"
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Fetching dashboard data failed." });
    });
};

/* =========================
   2. MANAGE HOMES (CRUD)
========================= */

exports.getHostHomes = (req, res, next) => {
  // Authentication check is handled by is-auth middleware
  Home.find({ userId: req.userId })
    .then((homes) => {
      res.status(200).json({
        pageTitle: "Your Listing",
        currentPage: "host-home-list",
        homes: homes || [],
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Fetching host homes failed." });
    });
};

exports.getAddHome = (req, res, next) => {
  res.status(200).json({
    pageTitle: "Add Home",
    currentPage: "add-home",
    editing: false,
    home: null
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, description, amenities, availableFrom, availableTo } = req.body;
  
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized: No User ID found" });
  }

  let selectedAmenities = [];
  if (amenities) {
      selectedAmenities = Array.isArray(amenities) ? amenities : [amenities];
  }

  // 🟢 RECTIFIED: Map paths for multiple files
  let photoUrls = [];
  if (req.files && req.files.length > 0) {
      photoUrls = req.files.map(file => "/" + file.path.replace(/\\/g, "/"));
  } else {
      photoUrls = ["https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1965&auto=format&fit=crop"];
  }

  const newHome = new Home({
    houseName, 
    price: Number(price),
    location, 
    rating: Number(rating) || 4.5,
    description,
    photoUrl: photoUrls, 
    amenities: selectedAmenities,
    availableFrom: new Date(availableFrom),
    availableTo: new Date(availableTo),
    userId: req.userId, 
  });

  newHome.save().then((result) => {
    res.status(201).json({ message: "Home Added Successfully", home: result });
  })
  .catch(err => {
      console.error("DATABASE SAVE ERROR:", err);
      res.status(500).json({ message: "Saving home failed." });
  });
};


exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId)
    .then((home) => {
      if (!home) return res.status(404).json({ message: "Home not found." });

      res.status(200).json({
        pageTitle: "Edit Home",
        currentPage: "host-home-list",
        editing: true,
        home: home,
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Fetching home for edit failed." });
    });
};

exports.postEditHome = async (req, res) => {
  try {
    const { 
      homeId, 
      houseName, 
      price, 
      location, 
      description, 
      availableFrom, 
      availableTo, 
      amenities 
    } = req.body;

    // 1. Find the home and verify ownership
    const home = await Home.findById(homeId);
    if (!home) return res.status(404).json({ message: "Home not found" });

    // Security check: only the creator can edit
    if (home.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // 2. Update text fields
    home.houseName = houseName || home.houseName;
    home.price = price || home.price;
    home.location = location || home.location;
    home.description = description || home.description;
    home.availableFrom = availableFrom || home.availableFrom;
    home.availableTo = availableTo || home.availableTo;

    // Handle amenities string to array conversion
    if (amenities) {
      home.amenities = JSON.parse(amenities);
    }

    // 3. Handle New Photos
    // If files were uploaded via Multer
    if (req.files && req.files.length > 0) {
      const newPhotoPaths = req.files.map(file => `/uploads/${file.filename}`);
      // Add new photos to the existing array (up to 5 total)
      home.photoUrl = [...home.photoUrl, ...newPhotoPaths].slice(0, 5);
    }

    await home.save();
    return res.status(200).json({ message: "Listing updated successfully!", home });

  } catch (err) {
    console.error("EDIT_HOME_ERROR:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId; 
  // Safety: Ensure user can only delete their own listings
  Home.findOneAndDelete({ _id: homeId, userId: req.userId })
    .then((result) => {
      if (!result) return res.status(404).json({ message: "Home not found or unauthorized." });
      res.status(200).json({ message: "Home deleted successfully." });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Deleting home failed." });
    });
};

/* =========================
   3. HOST BOOKING MANAGEMENT
========================= */

exports.getHostBookings = async (req, res) => {
  try {
    // 1. Find all homes owned by this host
    const myHomes = await Home.find({ userId: req.user._id });
    const myHomeIds = myHomes.map(h => h._id);

    // 2. Find all bookings for those specific homes
    const bookings = await Booking.find({ homeId: { $in: myHomeIds } })
      .populate("homeId", "houseName location price")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ bookings });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch host bookings" });
  }
};

exports.postHandleBooking = async (req, res) => {
  try {
    const { bookingId, action } = req.body; // action: 'Confirmed' or 'Declined'

    const status = action === "Accept" ? "Confirmed" : "Cancelled";
    
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: status },
      { new: true }
    );

    return res.status(200).json({ 
      message: `Booking ${action === "Accept" ? "accepted" : "declined"} successfully`,
      updatedBooking 
    });
  } catch (err) {
    return res.status(500).json({ message: "Action failed" });
  }
};