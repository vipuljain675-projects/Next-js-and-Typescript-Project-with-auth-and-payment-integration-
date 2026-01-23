const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    
    // 🟢 STEP 2: ADD THIS LINE (Crucial for Render)
    proxy: true 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // If user exists but has no Google ID, link it
        if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            await user.save();
        }
        return done(null, user);
      }

      // If new user, create them
      user = new User({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        avatar: profile.photos[0].value
      });

      await user.save();
      done(null, user);
    } catch (err) {
      console.error("Google Auth Error:", err);
      done(err, null);
    }
  }
));