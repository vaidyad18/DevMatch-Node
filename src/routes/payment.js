// routes/payment.js
const express = require("express");
const crypto = require("crypto");
const paymentRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const razorpayInstance = require("../utils/razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const { membershipAmounts } = require("../utils/constants");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { type } = req.body;
    const { firstName, lastName, emailId, _id: userId } = req.user || {};

    if (!type || !membershipAmounts?.[type]) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid membership type" });
    }

    const order = await razorpayInstance.orders.create({
      amount: membershipAmounts[type] * 100, // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: type,
        userId: String(userId),
      },
    });

    // Persist an entry for reconciliation
    const savedPayment = await new Payment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      notes: order.notes,
      userId,
      status: order.status, // "created"
      receipt: order.receipt,
    }).save();

    return res.json({
      // minimal + safe payload for the client
      orderId: savedPayment.orderId,
      amount: savedPayment.amount,
      currency: savedPayment.currency,
      notes: savedPayment.notes,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to expose
      success: true,
    });
  } catch (err) {
    console.error("payment/create error:", err);
    return res.status(400).json({
      success: false,
      error: "Error creating payment: " + err.message,
    });
  }
});

paymentRouter.post("/payment/verify", userAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, error: "Missing verification fields" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid signature" });
    }

    let remotePayment = await razorpayInstance.payments.fetch(
      razorpay_payment_id
    );

    if (remotePayment.status !== "captured") {
      return res.status(400).json({
        success: false,
        error: `Payment not captured (status: ${remotePayment.status})`,
      });
    }

    let paymentDoc = await Payment.findOne({ orderId: razorpay_order_id });
    if (!paymentDoc) {
      paymentDoc = await Payment.create({
        orderId: razorpay_order_id,
        amount: remotePayment.amount,
        currency: remotePayment.currency,
        notes: remotePayment.notes || {},
        userId: req.user._id,
        status: remotePayment.status,
        receipt: remotePayment.receipt || "post-verify",
      });
    } else {
      paymentDoc.status = "captured";
      await paymentDoc.save();
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.isPremium = true;
      user.membershipType =
        paymentDoc?.notes?.membershipType || user.membershipType || "silver";
      await user.save();
    }

    return res.json({ success: true, isPremium: true });
  } catch (err) {
    console.error("payment/verify error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  try {
    return res.json({ 
      isPremium: !!req.user?.isPremium,
      membershipType: req.user?.membershipType 
    });
  } catch (err) {
    return res.status(400).json({
      isPremium: false,
      error: "Error verifying payment: " + err.message,
    });
  }
});

module.exports = paymentRouter;
