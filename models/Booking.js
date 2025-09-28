const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, "Ticket quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    ticketPrice: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "refunded"],
      default: "pending",
    },
    payment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paidAt: Date,
    },
    bookingId: {
      type: String,
      unique: true,
      required: true,
    },
    attendeeInfo: {
      name: { type: String },
      email: {
        type: String,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
      },
      phone: {
        type: String,
        match: [/^\d{10}$/, "Phone number must be 10 digits"],
      },
    },
    qrCode: String,
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for faster lookup
bookingSchema.index({ bookingId: 1 });

// Pre-save hook to generate booking ID and calculate fees
bookingSchema.pre("save", function (next) {
  if (this.isNew) {
    // Generate unique booking ID
    if (!this.bookingId) {
      const shortId = Math.random().toString(36).substr(2, 5).toUpperCase();
      const timestamp = Date.now().toString().slice(-6); // e.g., last 6 digits
      this.bookingId = `SYNC-${timestamp}-${shortId}`;
    }

    // Calculate platform fee and total
    const subtotal = this.ticketPrice * this.quantity;
    this.platformFee = Math.round(subtotal * 0.05);
    this.totalAmount = subtotal + this.platformFee;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
