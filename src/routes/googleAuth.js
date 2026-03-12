const express = require("express");
const passport = require("passport");
const googleAuthRouter = express.Router();

const getCookieOptions = () => ({
  httpOnly: true,
  secure: true,
  sameSite: "None",
  path: "/",
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

googleAuthRouter.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })
);

googleAuthRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login` }),
  async (req, res) => {
    try {
      const user = req.user;
      const token = await user.getJWT();
      res.cookie("token", token, getCookieOptions());
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/profile`);
    } catch (err) {
      res.status(400).send("Error during Google authentication: " + err.message);
    }
  }
);

module.exports = googleAuthRouter;
