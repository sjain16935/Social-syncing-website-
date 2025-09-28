// Configuration settings for the Sync platform
const CONFIG = {
  API_BASE_URL: window.location.origin + "/api",
  STORAGE_KEYS: {
    TOKEN: "sync_auth_token",
    USER: "sync_auth_user",
    THEME: "sync_theme",
  },
  RAZORPAY: {
    KEY_ID: "rzp_test_your_key_here", // Replace with your actual Razorpay key
    CURRENCY: "INR",
  },
  PAGINATION: {
    EVENTS_PER_PAGE: 12,
    LOAD_MORE_THRESHOLD: 1000,
  },
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  },
  COMMISSION_RATE: 0.05, // 5% platform commission
  PLATFORM_FEE_RATE: 0.025, // 2.5% platform fee for attendees
}

// Environment detection
CONFIG.IS_DEVELOPMENT = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
CONFIG.IS_PRODUCTION = !CONFIG.IS_DEVELOPMENT

// API endpoints
CONFIG.ENDPOINTS = {
  // Auth endpoints
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",
  PROFILE: "/auth/profile",

  // Event endpoints
  EVENTS: "/events",
  FEATURED_EVENTS: "/events/featured",
  MY_EVENTS: "/events/my-events",
  CREATE_EVENT: "/events",
  UPDATE_EVENT: "/events",
  DELETE_EVENT: "/events",

  // Booking endpoints
  BOOKINGS: "/bookings",
  MY_BOOKINGS: "/bookings/my-bookings",
  CREATE_BOOKING: "/bookings",

  // Payment endpoints
  CREATE_ORDER: "/payments/create-order",
  VERIFY_PAYMENT: "/payments/verify",

  // User endpoints
  USERS: "/users",
  UPDATE_PROFILE: "/users/profile",

  // Upload endpoints
  UPLOAD_IMAGE: "/upload/image",
}

// Event categories
CONFIG.EVENT_CATEGORIES = [
  "Professional",
  "Party",
  "Cultural",
  "Educational",
  "Sports",
  "Food",
  "Music",
  "Art",
  "Technology",
  "Business",
  "Health",
  "Travel",
]

// Indian cities
CONFIG.CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Pimpri-Chinchwad",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Kalyan-Dombivali",
  "Vasai-Virar",
  "Varanasi",
]

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG
}
