const express = require("express");
const storeController = require("../controllers/storeController");
const isAuth = require("../middleware/is-auth");
const paymentController = require('../controllers/paymentController');

const router = express.Router();

/* HOMES */
router.get("/homes", storeController.getHomeList);
router.get("/homes/:homeId", storeController.getHomeDetails);

/* SEARCH */
router.get("/search", storeController.getSearchResults);

/* BOOKINGS */
router.get("/bookings", isAuth, storeController.getBookings);
router.post("/bookings", isAuth, storeController.postBooking);
router.post("/cancel-booking", isAuth, storeController.postCancelBooking);

/* FAVOURITES */
router.get("/favourite-list", isAuth, storeController.getFavouriteList);
router.post("/favourite-list", isAuth, storeController.postAddToFavourite);
router.post("/favourite-list/remove", isAuth, storeController.postRemoveFavourite);

/* REVIEWS */
// 🟢 RECTIFIED: Changed "/review" to "/reviews" to match HomeDetail.jsx
/* REVIEWS */
/* REVIEWS MANAGEMENT */
/* REVIEWS */
router.post("/reviews", isAuth, storeController.postReview);

// 🟢 NEW: These routes must exist to stop the "Endpoint Not Found" error
router.put("/reviews/:reviewId", isAuth, storeController.updateReview);
router.delete("/reviews/:reviewId", isAuth, storeController.deleteReview);

// 🟢 NEW: Payment Routes
router.post('/create-checkout-session', isAuth, paymentController.createCheckoutSession);
router.post('/verify-payment', isAuth, paymentController.verifyPayment);

module.exports = router;