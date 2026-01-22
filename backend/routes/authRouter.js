const express = require('express');
const passport = require('passport'); // 🟢 Import Passport
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/login', authController.postLogin);
router.post('/signup', authController.postSignup);
router.post('/logout', authController.postLogout);

// 🟢 GOOGLE AUTH ROUTES (Copy this part carefully)
// 1. Redirect to Google
router.get('/auth/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// 2. Google calls this back after login
router.get('/auth/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleAuthCallback
);

module.exports = router;