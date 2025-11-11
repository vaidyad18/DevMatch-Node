const express = require("express");
const User = require("../models/user");
const { validateSignupData } = require("../utils/validate");
const authRouter = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const jwt = require("jsonwebtoken");

authRouter.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password } = req.body;

    validateSignupData(req);

    const hashPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashPassword,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();
    res.cookie("token", token, { expires: new Date(Date.now() + 86400000) });
    res.send(user);
    res.json({ message: "Success", data: savedUser });
  } catch (err) {
    res.status(400).send("Error registering user: " + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid login credentials");
    }

    const isPassordValid = await user.validatePassword(password);
    if (isPassordValid) {
      const token = await user.getJWT();
      res.cookie("token", token, { expires: new Date(Date.now() + 86400000) });
      res.send(user);
    } else {
      throw new Error("Invalid login credentials");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, { expires: new Date(Date.now()) });
  res.send("User logged out successfully");
});

authRouter.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Cookie setup for local dev
    res.cookie("token", token, {
  httpOnly: true,
  secure: true,        // ✅ Chrome requires this when sameSite: "None"
  sameSite: "None",    // ✅ allows cross-origin between ports
  path: "/",           // ✅ all routes can access
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});


    // ✅ Redirect without token in URL
    res.redirect(`${process.env.FRONTEND_URL}/auth/success`);
  }
);



module.exports = authRouter;
