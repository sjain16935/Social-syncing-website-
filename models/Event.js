const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      enum: [
        "Professional",
        "Party",
        "Cultural",
        "Educational",
        "Sports",
        "Food",
        "Music",
        "Art",
        "Technology",
        "Other",
      ],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      // ✅ Optional improvement: Validate date > now in controller instead
    },
    time: {
      type: String,
      required: [true, "Event time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in HH:MM format"],
    },
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      venue: {
        type: String,
        required: [true, "Venue is required"],
        trim: true,
      },
      address: {
        type: String,
        required: [true, "Address is required"],
        trim: true,
      },
    },
    price: {
      type: Number,
      required: [true, "Ticket price is required"],
      min: [0, "Price cannot be negative"],
    },
    capacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    availableTickets: {
      type: Number,
      default: 0, // changed from `required: true` to `default`
    },
    coverImage: {
      url: {
        type: String,
        // required: true, // optional, depends on design
      },
      publicId: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "published",
    },
    settings: {
      isPrivate: { type: Boolean, default: false },
      requiresApproval: { type: Boolean, default: false },
      allowWaitlist: { type: Boolean, default: true },
    },
    stats: {
      views: { type: Number, default: 0 },
      bookings: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save: Set availableTickets to full capacity on first save
eventSchema.pre("save", function (next) {
  if (this.isNew) {
    this.availableTickets = this.capacity;
  }
  next();
});

// Indexes for search & filters
eventSchema.index({ title: "text", description: "text", tags: "text" });
eventSchema.index({ "location.city": 1, category: 1, date: 1 });
eventSchema.index({ host: 1, status: 1 });

module.exports = mongoose.model("Event", eventSchema);
