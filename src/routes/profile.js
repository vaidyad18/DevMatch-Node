const express = require("express");
const User = require("../models/user");
const { userAuth } = require("../middlewares/auth");
const profileRouter = express.Router();
const { validateProfileEditData } = require("../utils/validate");
const bcrypt = require("bcrypt");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("Error fetching profile: " + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    if (!validateProfileEditData(req)) {
      throw new Error("Invalid updates!");
    }
    const loggedInUser = req.user;
    Object.keys(req.body).forEach((field) => {
      loggedInUser[field] = req.body[field];
    });
    await loggedInUser.save();
    res.json({
      message: `${loggedInUser.firstName}, Your profile updated successfully`,
      user: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("Error updating profile: " + err.message);
  }
});

profileRouter.patch("/profile/password", userAuth, async (req, res) => {  
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new Error("Both old and new passwords are required");
    }
    if(oldPassword === newPassword){
        throw new Error("New password must be different from the old password");
    }
    const loggedInUser = req.user;
    const isMatch = await bcrypt.compare(oldPassword, loggedInUser.password);
    if (!isMatch) {
      throw new Error("Old password is incorrect");
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    loggedInUser.password = hashPassword;
    await loggedInUser.save();
    res.json({ message: "Password updated successfully",data:loggedInUser.password });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

module.exports = profileRouter;
