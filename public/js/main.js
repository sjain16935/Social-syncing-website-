// Main application JavaScript
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

async function initializeApp() {
  // Initialize mobile menu
  initializeMobileMenu()

  // Initialize smooth scrolling
  initializeSmoothScrolling()

  // Load page-specific content
  const currentPage = getCurrentPage()

  switch (currentPage) {
    case "home":
      await loadFeaturedEvents()
      initializeStatsCounter()
      break
    case "events":
      await loadEventsPage()
      break
    case "event-details":
      await loadEventDetails()
      break
    case "create-event":
      initializeCreateEventPage()
      break
    case "dashboard":
      await loadDashboard()
      break
  }
}

function getCurrentPage() {
  const path = window.location.pathname

  if (path === "/" || path.includes("index.html")) {
    return "home"
  } else if (path.includes("events.html") || path === "/events") {
    return "events"
  } else if (path.includes("event-details.html") || path === "/event-details") {
    return "event-details"
  } else if (path.includes("create-event.html") || path === "/create-event") {
    return "create-event"
  } else if (path.includes("dashboard.html") || path === "/dashboard") {
    return "dashboard"
  }

  return "unknown"
}

// Load featured events for home page
async function loadFeaturedEvents() {
  const grid = document.getElementById("featured-events-grid")
  if (!grid) return

  try {
    showLoading(grid)
    const response = await api.getFeaturedEvents()

    if (response.success && response.events.length > 0) {
      grid.innerHTML = response.events.map((event) => createEventCard(event)).join("")
    } else {
      // Load regular events if no featured events
      const regularEvents = await api.getEvents({ limit: 6 })
      if (regularEvents.success) {
        grid.innerHTML = regularEvents.events.map((event) => createEventCard(event)).join("")
      }
    }
  } catch (error) {
    console.error("Error loading featured events:", error)
    grid.innerHTML = '<p class="text-center text-gray-500">Unable to load events at the moment.</p>'
  }
}

// Load events page
async function loadEventsPage() {
  // Placeholder for loadEventsPage implementation
  console.log("Loading events page...")
}

// Load event details
async function loadEventDetails() {
  // Placeholder for loadEventDetails implementation
  console.log("Loading event details...")
}

// Initialize create event page
function initializeCreateEventPage() {
  // Placeholder for initializeCreateEventPage implementation
  console.log("Initializing create event page...")
}

// Load dashboard
async function loadDashboard() {
  // Placeholder for loadDashboard implementation
  console.log("Loading dashboard...")
}

// Create event card HTML
function createEventCard(event) {
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const imageUrl = event.coverImage?.url || "/placeholder.svg?height=200&width=400"
  const price = event.price === 0 ? "Free" : `₹${event.price}`
  const soldTickets = event.capacity - event.availableTickets
  const soldPercentage = Math.round((soldTickets / event.capacity) * 100)

  return `
    <div class="event-card" onclick="viewEvent('${event._id}')">
      <div class="event-image">
        <img src="${imageUrl}" alt="${event.title}" loading="lazy" onerror="this.src='/placeholder.svg?height=200&width=400'">
        <div class="event-price">${price}</div>
        <div class="event-category">${event.category}</div>
        ${soldPercentage > 80 ? '<div class="event-badge">Almost Full</div>' : ""}
      </div>
      <div class="event-content">
        <h3 class="event-title">${event.title}</h3>
        <p class="event-description">${truncateText(event.description, 100)}</p>
        <div class="event-details">
          <div class="event-detail">
            <i class="fas fa-calendar"></i>
            <span>${formattedDate}</span>
          </div>
          <div class="event-detail">
            <i class="fas fa-clock"></i>
            <span>${formatTime(event.time)}</span>
          </div>
          <div class="event-detail">
            <i class="fas fa-map-marker-alt"></i>
            <span>${event.location.city}, ${event.location.state}</span>
          </div>
          <div class="event-detail">
            <i class="fas fa-users"></i>
            <span>${soldTickets}/${event.capacity} attending</span>
          </div>
        </div>
        ${
          event.tags && event.tags.length > 0
            ? `
          <div class="event-tags">
            ${event.tags
              .slice(0, 3)
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join("")}
          </div>
        `
            : ""
        }
        <div class="event-footer">
          <div class="event-stats">
            ${
              event.stats?.rating
                ? `
              <div class="event-rating">
                <i class="fas fa-star"></i>
                <span>${event.stats.rating}</span>
                <span class="review-count">(${event.stats.reviewCount || 0})</span>
              </div>
            `
                : ""
            }
          </div>
          <div class="event-host">by ${event.host?.name || "Event Host"}</div>
        </div>
      </div>
    </div>
  `
}

// View event details
function viewEvent(eventId) {
  window.location.href = `/event-details?id=${eventId}`
}

// Initialize mobile menu
function initializeMobileMenu() {
  const hamburger = document.getElementById("hamburger")
  const navMenu = document.getElementById("nav-menu")

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active")
      hamburger.classList.toggle("active")
    })

    // Close menu when clicking on a link
    navMenu.addEventListener("click", (e) => {
      if (e.target.classList.contains("nav-link")) {
        navMenu.classList.remove("active")
        hamburger.classList.remove("active")
      }
    })
  }
}

// Initialize smooth scrolling
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
}

// Initialize stats counter animation
function initializeStatsCounter() {
  const stats = document.querySelectorAll(".stat-number")

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -100px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target)
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)

  stats.forEach((stat) => {
    observer.observe(stat)
  })
}

function animateCounter(element) {
  const target = Number.parseInt(element.textContent.replace(/\D/g, ""))
  const duration = 2000
  const step = target / (duration / 16)
  let current = 0

  const timer = setInterval(() => {
    current += step
    if (current >= target) {
      current = target
      clearInterval(timer)
    }

    const suffix = element.textContent.includes("+") ? "+" : ""
    element.textContent = Math.floor(current) + suffix
  }, 16)
}

// Utility functions
function showLoading(element) {
  if (element) {
    element.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Loading...</p>
      </div>
    `
  }
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification")
  existingNotifications.forEach((notification) => notification.remove())

  // Create new notification
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
        ? "exclamation-circle"
        : type === "warning"
          ? "exclamation-triangle"
          : "info-circle"

  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `

  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.animation = "slideOut 0.3s ease forwards"
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove()
        }
      }, 300)
    }
  }, 5000)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const hour12 = hours % 12 || 12
  const ampm = hours < 12 ? "AM" : "PM"
  return `${hour12}:${minutes} ${ampm}`
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.substr(0, maxLength) + "..."
}

// Error handling
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error)
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason)
})

// Declare api variable
const api = {
  getFeaturedEvents: async () => {
    // Placeholder for API call
    return { success: true, events: [] }
  },
  getEvents: async (params) => {
    // Placeholder for API call
    return { success: true, events: [] }
  },
}
