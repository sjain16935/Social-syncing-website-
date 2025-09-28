const express = require("express");
const User = require("../models/User");
const Event = require("../models/Event");
const Booking = require("../models/Booking");
const { auth } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    const [myEvents, myBookings] = await Promise.all([
      Event.find({ host: userId }).sort({ createdAt: -1 }).limit(5),
      Booking.find({ user: userId })
        .populate("event", "title date time location coverImage")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const [totalEvents, totalBookings] = await Promise.all([
      Event.countDocuments({ host: userId }),
      Booking.countDocuments({ user: userId, status: "confirmed" }),
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueData = await Event.aggregate([
      {
        $match: {
          host: userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$stats.revenue" },
          events: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.json({
      success: true,
      dashboard: {
        user: {
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          stats: user.stats,
        },
        stats: {
          totalEvents,
          totalBookings,
          totalRevenue: user.stats.totalEarned,
          totalSpent: user.stats.totalSpent,
        },
        myEvents,
        myBookings,
        revenueData,
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
    });
  }
});

// @route   GET /api/users/analytics
// @desc    Get user analytics data
// @access  Private
router.get("/analytics", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = "6months" } = req.query;

    const startDate = new Date();
    switch (period) {
      case "1month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6months":
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    const eventMatch = {
      host: userId,
      createdAt: { $gte: startDate },
    };

    const [eventPerformance, revenueTrends, categoryPerformance] = await Promise.all([
      Event.aggregate([
        { $match: eventMatch },
        {
          $project: {
            title: 1,
            capacity: 1,
            availableTickets: 1,
            "stats.bookings": 1,
            "stats.revenue": 1,
            "stats.views": 1,
            attendanceRate: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ["$capacity", "$availableTickets"] },
                    "$capacity",
                  ],
                },
                100,
              ],
            },
          },
        },
        { $sort: { "stats.revenue": -1 } },
      ]),

      Event.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$stats.revenue" },
            events: { $sum: 1 },
            bookings: { $sum: "$stats.bookings" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      Event.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: "$category",
            events: { $sum: 1 },
            revenue: { $sum: "$stats.revenue" },
            bookings: { $sum: "$stats.bookings" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      analytics: {
        eventPerformance,
        revenueTrends,
        categoryPerformance,
        period,
      },
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics data",
    });
  }
});

module.exports = router;
