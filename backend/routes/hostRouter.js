const express = require('express');
const multer = require('multer');
const hostController = require('../controllers/hostController');
const isAuth = require('../middleware/is-auth'); // Import JWT protector

const router = express.Router();

// MULTER SETUP (Preserved exactly)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// 1. Manage Bookings (Protected)
router.get("/manage-bookings", isAuth, hostController.getHostBookings);
router.post("/manage-bookings", isAuth, hostController.postHandleBooking);

// 2. Add Home (Protected)
router.get('/add-home', isAuth, hostController.getAddHome);
router.post('/add-home', isAuth, upload.array('photos', 5), hostController.postAddHome);

// 3. Your Listings (Protected)
router.get('/host-home-list', isAuth, hostController.getHostHomes);

// 4. Edit & Delete (Protected)
router.get('/edit-home/:homeId', isAuth, hostController.getEditHome);
router.post('/edit-home', isAuth, upload.array('photos', 5), hostController.postEditHome);
router.post('/delete-home/:homeId', isAuth, hostController.postDeleteHome);

// 5. Dashboard (Protected)
router.get('/', isAuth, hostController.getHostDashboard);

module.exports = router;