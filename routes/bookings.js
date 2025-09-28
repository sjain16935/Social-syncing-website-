const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const { auth } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post(
  "/",
  [
    auth,
    body("eventId").isMongoId().withMessage("Invalid event ID"),
    body("quantity").isInt({ min: 1, max: 10 }).withMessage("Quantity must be between 1-10"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { eventId, quantity } = req.body;

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });

      if (event.status !== "published") {
        return res.status(400).json({ success: false, message: "Event not open for booking" });
      }

      if (event.date < new Date()) {
        return res.status(400).json({ success: false, message: "Cannot book past events" });
      }

      if (event.availableTickets < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${event.availableTickets} tickets available`,
        });
      }

      if (event.host.toString() === req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "Cannot book your own event" });
      }

      const existingBooking = await Booking.findOne({ user: req.user._id, event: eventId });
      if (existingBooking) {
        return res.status(400).json({ success: false, message: "You have already booked this event" });
      }

      const booking = new Booking({
        event: eventId,
        user: req.user._id,
        quantity,
        ticketPrice: event.price,
        attendeeInfo: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
        },
      });

      await booking.save();

      event.availableTickets -= quantity;
      event.stats.bookings += quantity;
      await event.save();

      await booking.populate([
        { path: "event", select: "title date time location coverImage" },
        { path: "user", select: "name email phone" },
      ]);

      res.status(201).json({ success: true, message: "Booking successful", booking });
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ success: false, message: "Server error during booking" });
    }
  }
);

// @route   GET /api/bookings/my
// @desc    Get current user's bookings
// @access  Private
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("event", "title date time location coverImage status")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Get my bookings error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching bookings" });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("event", "title date time location coverImage host")
      .populate("user", "name email phone");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const userId = req.user._id.toString();
    const isOwner = booking.user._id.toString() === userId;
    const isHost = booking.event.host.toString() === userId;

    if (!isOwner && !isHost) {
      return res.status(403).json({ success: false, message: "Not authorized to view this booking" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching booking" });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put(
  "/:id/cancel",
  [
    auth,
    body("reason").optional().trim().isLength({ max: 500 }).withMessage("Reason cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const booking = await Booking.findById(req.params.id).populate("event");
      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found" });
      }

      if (booking.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized to cancel this booking" });
      }

      if (booking.status === "cancelled") {
        return res.status(400).json({ success: false, message: "Booking is already cancelled" });
      }

      const eventDateTime = new Date(`${booking.event.date.toDateString()} ${booking.event.time}`);
      const hoursUntilEvent = (eventDateTime - new Date()) / 36e5; // milliseconds → hours

      if (hoursUntilEvent < 24) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel booking less than 24 hours before the event",
        });
      }

      booking.status = "cancelled";
      await booking.save();

      const event = await Event.findById(booking.event._id);
      event.availableTickets += booking.quantity;
      event.stats.bookings -= booking.quantity;
      await event.save();

      res.json({ success: true, message: "Booking cancelled successfully", booking });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ success: false, message: "Server error while cancelling booking" });
    }
  }
);

module.exports = router;
