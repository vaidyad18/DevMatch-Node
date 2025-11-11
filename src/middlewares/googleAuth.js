const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const User = require("../models/user");

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            firstName: profile.displayName.split(" ")[0] || "Google",
            lastName: profile.displayName.split(" ")[1] || "",
            emailId:
              profile.emails?.[0]?.value || `noemail-${profile.id}@google.com`,
            password: "google-oauth", // placeholder, required by your schema
            skills: [], // if required in schema
            role: "Student",
            experience: "Fresher",
            description: "Hey there! I am using DevMatch.",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) =>
  User.findById(id).then((user) => done(null, user))
);

module.exports = passport;
