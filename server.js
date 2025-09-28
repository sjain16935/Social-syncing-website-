const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const app = express();

// ------------------ Security Middleware ------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());

// ------------------ Rate Limiting ------------------
const limiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// ------------------ CORS ------------------
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5000",
    credentials: true,
  })
);

// ------------------ Body Parsers ------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ------------------ Static Files ------------------
app.use(express.static(path.join(__dirname, "public")));

// ------------------ MongoDB Connection ------------------
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sync-events", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------ API Routes ------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/users", require("./routes/users"));

// ------------------ Serve Frontend Routes ------------------
const sendHtml = (file) => (req, res) =>
  res.sendFile(path.join(__dirname, "public", file));

app.get("/", sendHtml("index.html"));
app.get("/events", sendHtml("events.html"));
app.get("/event-details", sendHtml("event-details.html"));
app.get("/create-event", sendHtml("create-event.html"));
app.get("/dashboard", sendHtml("dashboard.html"));

// Catch-all for SPA (if using React/Vanilla SPA fallback)
app.get("*", sendHtml("index.html"));

// ------------------ Error Handling Middleware ------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

// ------------------ Server Start ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});
