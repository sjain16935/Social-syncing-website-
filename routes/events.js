const express = require("express")
const { body, validationResult, query } = require("express-validator")
const Event = require("../models/Event")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const { upload } = require("../middleware/upload")

const router = express.Router()

// @route   GET /api/events
// @desc    Get all events with filtering and pagination
// @access  Public
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
    query("city").optional().trim(),
    query("category").optional().trim(),
    query("search").optional().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() })
      }

      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 12
      const skip = (page - 1) * limit

      const filter = { status: "published", date: { $gte: new Date() } }
      if (req.query.city) filter["location.city"] = new RegExp(req.query.city, "i")
      if (req.query.category) filter.category = req.query.category
      if (req.query.search) filter.$text = { $search: req.query.search }

      const events = await Event.find(filter)
        .populate("host", "name avatar")
        .sort({ date: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Event.countDocuments(filter)

      res.json({
        success: true,
        events,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      })
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error while fetching events" })
    }
  }
)

// @route   GET /api/events/featured
router.get("/featured", async (req, res) => {
  try {
    const events = await Event.find({ status: "published", date: { $gte: new Date() } })
      .populate("host", "name avatar")
      .sort({ "stats.views": -1, "stats.bookings": -1 })
      .limit(6)

    res.json({ success: true, events })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while fetching featured events" })
  }
})

// @route   GET /api/events/my
router.get("/my", auth, async (req, res) => {
  try {
    const events = await Event.find({ host: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, events })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while fetching your events" })
  }
})

// @route   GET /api/events/:id
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("host", "name avatar email phone")
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    event.stats.views += 1
    await event.save()
    res.json({ success: true, event })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while fetching event" })
  }
})

// @route   POST /api/events
router.post(
  "/",
  [
    auth,
    upload.single("coverImage"),
    body("title").trim().isLength({ min: 5, max: 100 }),
    body("description").trim().isLength({ min: 20, max: 2000 }),
    body("category").isIn(["Professional", "Party", "Cultural", "Educational", "Sports", "Food", "Music", "Art", "Technology", "Other"]),
    body("date").isISO8601(),
    body("time").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("city").trim().isLength({ min: 2 }),
    body("state").trim().isLength({ min: 2 }),
    body("venue").trim().isLength({ min: 2 }),
    body("address").trim().isLength({ min: 10 }),
    body("price").isFloat({ min: 0 }),
    body("capacity").isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

      const eventData = {
        ...req.body,
        location: {
          city: req.body.city,
          state: req.body.state,
          venue: req.body.venue,
          address: req.body.address,
        },
        host: req.user._id,
        price: parseFloat(req.body.price),
        capacity: parseInt(req.body.capacity),
      }

      if (req.file) {
        eventData.coverImage = {
          url: req.file.path,
          publicId: req.file.filename,
        }
      }

      if (req.body.tags) {
        eventData.tags = Array.isArray(req.body.tags)
          ? req.body.tags
          : req.body.tags.split(",").map(tag => tag.trim())
      }

      if (req.body.settings) {
        eventData.settings = JSON.parse(req.body.settings)
      }

      const event = new Event(eventData)
      await event.save()

      await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.eventsCreated": 1 } })
      await event.populate("host", "name avatar")

      res.status(201).json({ success: true, message: "Event created successfully", event })
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error while creating event" })
    }
  }
)

// @route   PUT /api/events/:id
router.put("/:id", [auth, upload.single("coverImage")], async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    if (event.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this event" })
    }

    const updateData = { ...req.body }
    if (req.body.city || req.body.state || req.body.venue || req.body.address) {
      updateData.location = {
        city: req.body.city || event.location.city,
        state: req.body.state || event.location.state,
        venue: req.body.venue || event.location.venue,
        address: req.body.address || event.location.address,
      }
    }

    if (req.file) {
      updateData.coverImage = {
        url: req.file.path,
        publicId: req.file.filename,
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate("host", "name avatar")
    res.json({ success: true, message: "Event updated successfully", event: updatedEvent })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while updating event" })
  }
})

// @route   DELETE /api/events/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ success: false, message: "Event not found" })
    if (event.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this event" })
    }

    await Event.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: "Event deleted successfully" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error while deleting event" })
  }
})

module.exports = router
