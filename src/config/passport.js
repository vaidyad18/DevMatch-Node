const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL || "http://localhost:7777"}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if a user with the same email already exists
          user = await User.findOne({ emailId: profile.emails[0].value });

          if (user) {
            // Link Google ID to existing account
            user.googleId = profile.id;
            await user.save();
          } else {
            // Create new user
            user = new User({
              firstName: profile.name.givenName || "User",
              lastName: profile.name.familyName || "",
              emailId: profile.emails[0].value,
              googleId: profile.id,
              photoURL: profile.photos[0].value,
              skills: [], // Default empty array for required field
              // Password is not required for OAuth users
              password: "Password@123", // Dummy password that satisfies the validator
            });
            await user.save();
          }
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
