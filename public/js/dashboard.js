// Dashboard page functionality
let currentTab = "overview"
let dashboardData = {}
const auth = {} // Declare auth variable
const api = {} // Declare api variable
const showNotification = (message, type) => {
  console.log(`Notification: ${message} (${type})`)
} // Declare showNotification function

document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
})

async function initializeDashboard() {
  // Check authentication
  if (!auth.requireAuth()) {
    return
  }

  setupTabs()
  await loadDashboardData()
  setupEventHandlers()
}

function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab")
      switchTab(tabName)
    })
  })
}

function switchTab(tabName) {
  // Update active tab button
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active")

  // Update active tab content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active")
  })
  document.getElementById(tabName).classList.add("active")

  currentTab = tabName

  // Load tab-specific data
  switch (tabName) {
    case "overview":
      loadOverviewData()
      break
    case "my-events":
      loadMyEvents()
      break
    case "bookings":
      loadMyBookings()
      break
    case "analytics":
      loadAnalytics()
      break
  }
}

async function loadDashboardData() {
  try {
    const response = await api.getDashboardStats()
    if (response.success) {
      dashboardData = response.data
      loadOverviewData()
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    showNotification("Failed to load dashboard data", "error")
  }
}

function loadOverviewData() {
  loadStatsCards()
  loadRecentEvents()
  loadRevenueBreakdown()
}

function loadStatsCards() {
  const statsGrid = document.getElementById("stats-grid")
  if (!statsGrid) return

  const stats = dashboardData.stats || {
    totalEvents: 0,
    totalRevenue: 0,
    totalAttendees: 0,
    avgRating: 0,
  }

  statsGrid.innerHTML = `
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <h3>${stats.totalEvents}</h3>
          <p>Total Events</p>
        </div>
        <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
          <i class="fas fa-calendar-alt"></i>
        </div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <h3>₹${formatNumber(stats.totalRevenue)}</h3>
          <p>Total Revenue</p>
        </div>
        <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <i class="fas fa-rupee-sign"></i>
        </div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <h3>${stats.totalAttendees}</h3>
          <p>Total Attendees</p>
        </div>
        <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <i class="fas fa-users"></i>
        </div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-info">
          <h3>${stats.avgRating.toFixed(1)}</h3>
          <p>Average Rating</p>
        </div>
        <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <i class="fas fa-star"></i>
        </div>
      </div>
    </div>
  `
}

async function loadRecentEvents() {
  const container = document.getElementById("recent-events")
  if (!container) return

  try {
    const response = await api.getMyEvents()

    if (response.success && response.events.length > 0) {
      const recentEvents = response.events.slice(0, 5)

      container.innerHTML = recentEvents
        .map(
          (event) => `
        <div class="recent-event-item" onclick="viewEvent('${event._id}')">
          <div class="event-info">
            <h4>${event.title}</h4>
            <p>${formatDate(event.date)} • ${event.location.city}</p>
          </div>
          <div class="event-stats">
            <span class="attendees">${event.capacity - event.availableTickets}/${event.capacity}</span>
            <span class="revenue">₹${formatNumber(event.revenue || 0)}</span>
          </div>
        </div>
      `,
        )
        .join("")
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-plus"></i>
          <p>No events yet</p>
          <a href="/create-event" class="btn btn-primary btn-sm">Create Your First Event</a>
        </div>
      `
    }
  } catch (error) {
    console.error("Error loading recent events:", error)
    container.innerHTML = '<p class="error-message">Failed to load recent events</p>'
  }
}

function loadRevenueBreakdown() {
  const container = document.getElementById("revenue-breakdown")
  if (!container) return

  const breakdown = dashboardData.revenueBreakdown || {
    thisMonth: 0,
    lastMonth: 0,
    growth: 0,
  }

  container.innerHTML = `
    <div class="revenue-item">
      <div class="revenue-label">This Month</div>
      <div class="revenue-amount">₹${formatNumber(breakdown.thisMonth)}</div>
    </div>
    <div class="revenue-item">
      <div class="revenue-label">Last Month</div>
      <div class="revenue-amount">₹${formatNumber(breakdown.lastMonth)}</div>
    </div>
    <div class="revenue-item">
      <div class="revenue-label">Growth</div>
      <div class="revenue-amount ${breakdown.growth >= 0 ? "positive" : "negative"}">
        ${breakdown.growth >= 0 ? "+" : ""}${breakdown.growth.toFixed(1)}%
      </div>
    </div>
  `
}

async function loadMyEvents() {
  const container = document.getElementById("my-events-list")
  if (!container) return

  try {
    showLoading(container)
    const response = await api.getMyEvents()

    if (response.success && response.events.length > 0) {
      container.innerHTML = response.events.map((event) => createEventManagementCard(event)).join("")
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-plus"></i>
          <h3>No events yet</h3>
          <p>Start by creating your first event</p>
          <a href="/create-event" class="btn btn-primary">Create Event</a>
        </div>
      `
    }
  } catch (error) {
    console.error("Error loading my events:", error)
    container.innerHTML = '<p class="error-message">Failed to load events</p>'
  }
}

function createEventManagementCard(event) {
  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()
  const soldTickets = event.capacity - event.availableTickets
  const soldPercentage = Math.round((soldTickets / event.capacity) * 100)

  return `
    <div class="event-management-card">
      <div class="event-image">
        <img src="${event.coverImage?.url || "/placeholder.svg?height=150&width=250"}" alt="${event.title}">
        <div class="event-status ${isUpcoming ? "upcoming" : "past"}">
          ${isUpcoming ? "Upcoming" : "Completed"}
        </div>
      </div>
      
      <div class="event-details">
        <h3>${event.title}</h3>
        <div class="event-meta">
          <div class="meta-item">
            <i class="fas fa-calendar"></i>
            <span>${formatDate(event.date)}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${event.location.city}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-users"></i>
            <span>${soldTickets}/${event.capacity} (${soldPercentage}%)</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-rupee-sign"></i>
            <span>₹${formatNumber(event.revenue || 0)}</span>
          </div>
        </div>
      </div>
      
      <div class="event-actions">
        <button class="btn btn-outline btn-sm" onclick="viewEvent('${event._id}')">
          <i class="fas fa-eye"></i>
          View
        </button>
        ${
          isUpcoming
            ? `
          <button class="btn btn-outline btn-sm" onclick="editEvent('${event._id}')">
            <i class="fas fa-edit"></i>
            Edit
          </button>
        `
            : ""
        }
        <button class="btn btn-outline btn-sm" onclick="viewEventAnalytics('${event._id}')">
          <i class="fas fa-chart-bar"></i>
          Analytics
        </button>
      </div>
    </div>
  `
}

async function loadMyBookings() {
  const container = document.getElementById("bookings-list")
  if (!container) return

  try {
    showLoading(container)
    const response = await api.getMyBookings()

    if (response.success && response.bookings.length > 0) {
      container.innerHTML = response.bookings.map((booking) => createBookingCard(booking)).join("")
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <h3>No bookings yet</h3>
          <p>Start by booking your first event</p>
          <a href="/events" class="btn btn-primary">Browse Events</a>
        </div>
      `
    }
  } catch (error) {
    console.error("Error loading bookings:", error)
    container.innerHTML = '<p class="error-message">Failed to load bookings</p>'
  }
}

function createBookingCard(booking) {
  const event = booking.event
  const eventDate = new Date(event.date)
  const isUpcoming = eventDate > new Date()

  return `
    <div class="booking-card">
      <div class="booking-image">
        <img src="${event.coverImage?.url || "/placeholder.svg?height=100&width=150"}" alt="${event.title}">
      </div>
      
      <div class="booking-details">
        <h4>${event.title}</h4>
        <div class="booking-meta">
          <div class="meta-item">
            <i class="fas fa-calendar"></i>
            <span>${formatDate(event.date)} at ${formatTime(event.time)}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${event.location.venue}, ${event.location.city}</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-ticket-alt"></i>
            <span>${booking.quantity} ticket(s)</span>
          </div>
          <div class="meta-item">
            <i class="fas fa-rupee-sign"></i>
            <span>₹${booking.totalAmount}</span>
          </div>
        </div>
        
        <div class="booking-status ${booking.status}">
          ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </div>
      </div>
      
      <div class="booking-actions">
        <button class="btn btn-outline btn-sm" onclick="viewEvent('${event._id}')">
          View Event
        </button>
        ${
          isUpcoming && booking.status === "confirmed"
            ? `
          <button class="btn btn-outline btn-sm" onclick="downloadTicket('${booking._id}')">
            <i class="fas fa-download"></i>
            Ticket
          </button>
        `
            : ""
        }
      </div>
    </div>
  `
}

async function loadAnalytics() {
  const period = document.getElementById("analytics-period")?.value || "6months"

  try {
    // Load performance data
    await loadEventPerformance(period)
    await loadRevenueTrends(period)
  } catch (error) {
    console.error("Error loading analytics:", error)
    showNotification("Failed to load analytics data", "error")
  }
}

async function loadEventPerformance(period) {
  const container = document.getElementById("performance-list")
  if (!container) return

  try {
    const response = await api.getMyEvents()

    if (response.success && response.events.length > 0) {
      const events = response.events
        .map((event) => {
          const soldTickets = event.capacity - event.availableTickets
          const soldPercentage = Math.round((soldTickets / event.capacity) * 100)

          return {
            ...event,
            soldTickets,
            soldPercentage,
            revenue: event.revenue || 0,
          }
        })
        .sort((a, b) => b.revenue - a.revenue)

      container.innerHTML = events
        .map(
          (event) => `
        <div class="performance-item">
          <div class="performance-info">
            <h5>${event.title}</h5>
            <p>${formatDate(event.date)} • ${event.location.city}</p>
          </div>
          <div class="performance-stats">
            <div class="stat">
              <span class="label">Sold</span>
              <span class="value">${event.soldPercentage}%</span>
            </div>
            <div class="stat">
              <span class="label">Revenue</span>
              <span class="value">₹${formatNumber(event.revenue)}</span>
            </div>
            <div class="stat">
              <span class="label">Attendees</span>
              <span class="value">${event.soldTickets}</span>
            </div>
          </div>
        </div>
      `,
        )
        .join("")
    } else {
      container.innerHTML = '<p class="empty-message">No events to analyze</p>'
    }
  } catch (error) {
    console.error("Error loading performance data:", error)
    container.innerHTML = '<p class="error-message">Failed to load performance data</p>'
  }
}

function loadRevenueTrends(period) {
  const container = document.getElementById("revenue-trends")
  if (!container) return

  // Mock revenue trends data
  const trends = {
    "7days": [100, 150, 200, 180, 220, 250, 300],
    "30days": [1000, 1200, 1100, 1300, 1500, 1400, 1600, 1800, 1700, 1900],
    "3months": [5000, 5500, 6000, 5800, 6200, 6500, 7000, 6800, 7200, 7500, 8000, 8200],
    "6months": [10000, 11000, 12000, 11500, 12500, 13000, 13500, 14000, 14500, 15000, 15500, 16000],
  }

  const data = trends[period] || trends["6months"]
  const labels = data.map((_, index) => `Period ${index + 1}`)

  container.innerHTML = `
    <div class="trends-chart">
      <div class="chart-placeholder">
        <i class="fas fa-chart-line"></i>
        <p>Revenue trends for ${period}</p>
        <div class="trend-summary">
          <div class="trend-item">
            <span>Total Revenue</span>
            <span>₹${formatNumber(data.reduce((a, b) => a + b, 0))}</span>
          </div>
          <div class="trend-item">
            <span>Average</span>
            <span>₹${formatNumber(data.reduce((a, b) => a + b, 0) / data.length)}</span>
          </div>
          <div class="trend-item">
            <span>Peak</span>
            <span>₹${formatNumber(Math.max(...data))}</span>
          </div>
        </div>
      </div>
    </div>
  `
}

function setupEventHandlers() {
  // Analytics period change
  const analyticsPeriod = document.getElementById("analytics-period")
  if (analyticsPeriod) {
    analyticsPeriod.addEventListener("change", () => {
      if (currentTab === "analytics") {
        loadAnalytics()
      }
    })
  }
}

// Event action handlers
function viewEvent(eventId) {
  window.location.href = `/event-details?id=${eventId}`
}

function editEvent(eventId) {
  window.location.href = `/create-event?edit=${eventId}`
}

function viewEventAnalytics(eventId) {
  // Switch to analytics tab and filter by event
  switchTab("analytics")
  // Additional logic to filter analytics by specific event
}

function downloadTicket(bookingId) {
  // Implementation for downloading ticket
  showNotification("Ticket download started", "info")
}

// Utility functions
function formatNumber(num) {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + "Cr"
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + "L"
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const hour12 = hours % 12 || 12
  const ampm = hours < 12 ? "AM" : "PM"
  return `${hour12}:${minutes} ${ampm}`
}

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
