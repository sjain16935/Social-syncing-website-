// Events page functionality
let allEvents = []
let filteredEvents = []
let currentPage = 1
let isLoading = false
const api = {
  // Declare the api variable here
  getEvents: async (params) => {
    // Mock implementation for demonstration purposes
    return {
      success: true,
      events: [
        // Sample event data
      ],
    }
  },
}

document.addEventListener("DOMContentLoaded", () => {
  initializeEventsPage()
})

async function initializeEventsPage() {
  setupFilters()
  await loadEvents()
  setupInfiniteScroll()
}

function setupFilters() {
  const searchInput = document.getElementById("search-input")
  const cityFilter = document.getElementById("city-filter")
  const categoryFilter = document.getElementById("category-filter")
  const dateFilter = document.getElementById("date-filter")
  const sortSelect = document.getElementById("sort-select")

  if (searchInput) {
    searchInput.addEventListener("input", debounce(filterEvents, 300))
  }

  if (cityFilter) {
    cityFilter.addEventListener("change", filterEvents)
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterEvents)
  }

  if (dateFilter) {
    dateFilter.addEventListener("change", filterEvents)
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", filterEvents)
  }

  // Set minimum date to today
  if (dateFilter) {
    const today = new Date().toISOString().split("T")[0]
    dateFilter.min = today
  }
}

async function loadEvents() {
  const container = document.getElementById("events-grid")
  if (!container) return

  try {
    isLoading = true
    showLoading(container)

    const response = await api.getEvents({
      page: currentPage,
      limit: 12,
    })

    if (response.success) {
      if (currentPage === 1) {
        allEvents = response.events
      } else {
        allEvents = [...allEvents, ...response.events]
      }

      filteredEvents = [...allEvents]
      displayEvents()
      updateResultsCount()
    } else {
      throw new Error(response.message || "Failed to load events")
    }
  } catch (error) {
    console.error("Error loading events:", error)
    container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to load events</h3>
                <p>Please try again later</p>
                <button class="btn btn-primary" onclick="loadEvents()">Retry</button>
            </div>
        `
  } finally {
    isLoading = false
  }
}

function filterEvents() {
  const searchTerm = document.getElementById("search-input")?.value.toLowerCase() || ""
  const selectedCity = document.getElementById("city-filter")?.value || ""
  const selectedCategory = document.getElementById("category-filter")?.value || ""
  const selectedDate = document.getElementById("date-filter")?.value || ""
  const sortBy = document.getElementById("sort-select")?.value || "date"

  // Filter events
  filteredEvents = allEvents.filter((event) => {
    const matchesSearch =
      !searchTerm ||
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      event.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))

    const matchesCity = !selectedCity || event.location.city === selectedCity
    const matchesCategory = !selectedCategory || event.category === selectedCategory

    const matchesDate = !selectedDate || new Date(event.date).toISOString().split("T")[0] === selectedDate

    return matchesSearch && matchesCity && matchesCategory && matchesDate
  })

  // Sort events
  sortEvents(sortBy)

  displayEvents()
  updateResultsCount()
}

function sortEvents(sortBy) {
  switch (sortBy) {
    case "date":
      filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date))
      break
    case "price-low":
      filteredEvents.sort((a, b) => a.price - b.price)
      break
    case "price-high":
      filteredEvents.sort((a, b) => b.price - a.price)
      break
    case "popularity":
      filteredEvents.sort((a, b) => {
        const aAttendees = a.capacity - a.availableTickets
        const bAttendees = b.capacity - b.availableTickets
        return bAttendees - aAttendees
      })
      break
    case "rating":
      filteredEvents.sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0))
      break
  }
}

function displayEvents() {
  const container = document.getElementById("events-grid")
  const noResults = document.getElementById("no-results")

  if (!container) return

  if (filteredEvents.length === 0) {
    container.style.display = "none"
    if (noResults) noResults.style.display = "block"
    return
  }

  container.style.display = "grid"
  if (noResults) noResults.style.display = "none"

  container.innerHTML = filteredEvents.map((event) => createEventCard(event)).join("")
}

function updateResultsCount() {
  const resultsCount = document.getElementById("results-count")
  if (resultsCount) {
    resultsCount.textContent = `Showing ${filteredEvents.length} of ${allEvents.length} events`
  }
}

function setupInfiniteScroll() {
  window.addEventListener("scroll", () => {
    if (isLoading) return

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement

    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      loadMoreEvents()
    }
  })
}

async function loadMoreEvents() {
  if (isLoading) return

  currentPage++
  await loadEvents()
}

// Utility function for debouncing
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Create event card (reuse from main.js)
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

function viewEvent(eventId) {
  window.location.href = `/event-details?id=${eventId}`
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

function showLoading(element) {
  if (element) {
    element.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <p>Loading events...</p>
            </div>
        `
  }
}
