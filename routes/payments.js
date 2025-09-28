const express = require("express")
const Razorpay = require("razorpay")
const crypto = require("crypto")
const { body, validationResult } = require("express-validator")
const Booking = require("../models/Booking")
const Event = require("../models/Event")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Common validation handler
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

// @route   POST /api/payments/orders
// @desc    Create Razorpay order
// @access  Private
router.post(
  "/orders",
  [
    auth,
    body("bookingId").isMongoId().withMessage("Invalid booking ID"),
    validate,
  ],
  async (req, res) => {
    try {
      const { bookingId } = req.body

      const booking = await Booking.findById(bookingId).populate("event", "title").populate("user", "name email phone")
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" })
      }

      if (booking.user?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized to pay for this booking" })
      }

      if (booking.payment.status === "completed") {
        return res.status(400).json({ success: false, message: "Payment already completed for this booking" })
      }

      const orderOptions = {
        amount: booking.totalAmount * 100,
        currency: "INR",
        receipt: booking.bookingId,
        notes: {
          bookingId: booking._id.toString(),
          eventId: booking.event._id.toString(),
          userId: booking.user._id.toString(),
        },
      }

      const order = await razorpay.orders.create(orderOptions)
      booking.payment.razorpayOrderId = order.id
      await booking.save()

      res.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          totalAmount: booking.totalAmount,
          event: booking.event,
          user: booking.user,
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      })
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error("Create order error:", error)
      res.status(500).json({ success: false, message: "Internal error while creating Razorpay order" })
    }
  }
)

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post(
  "/verify",
  [
    auth,
    body("razorpay_order_id").notEmpty().withMessage("Order ID is required"),
    body("razorpay_payment_id").notEmpty().withMessage("Payment ID is required"),
    body("razorpay_signature").notEmpty().withMessage("Signature is required"),
    body("bookingId").isMongoId().withMessage("Invalid booking ID"),
    validate,
  ],
  async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body

      const booking = await Booking.findById(bookingId).populate("event")
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" })
      }

      if (booking.user?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized to verify this payment" })
      }

      if (booking.payment.status === "completed") {
        return res.status(400).json({ success: false, message: "Payment already verified" })
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex")

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Invalid payment signature" })
      }

      booking.payment.razorpayPaymentId = razorpay_payment_id
      booking.payment.razorpaySignature = razorpay_signature
      booking.payment.status = "completed"
      booking.payment.paidAt = new Date()
      booking.status = "confirmed"
      await booking.save()

      const event = await Event.findById(booking.event._id)
      event.stats.revenue = Number(event.stats.revenue || 0) + booking.totalAmount
      await event.save()

      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          "stats.eventsAttended": 1,
          "stats.totalSpent": booking.totalAmount,
        },
      })

      const hostEarnings = booking.totalAmount - booking.platformFee
      await User.findByIdAndUpdate(event.host, {
        $inc: { "stats.totalEarned": hostEarnings },
      })

      res.json({
        success: true,
        message: "Payment verified successfully",
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          status: booking.status,
          payment: booking.payment,
        },
      })
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error("Verify payment error:", error)
      res.status(500).json({ success: false, message: "Internal error verifying Razorpay payment" })
    }
  }
)

// @route   GET /api/payments/orders/:orderId
// @desc    Get Razorpay order details
// @access  Private
router.get("/orders/:orderId", auth, async (req, res) => {
  try {
    const order = await razorpay.orders.fetch(req.params.orderId)
    res.json({ success: true, order })
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.error("Get order error:", error)
    res.status(500).json({ success: false, message: "Error fetching order details" })
  }
})

module.exports = router
