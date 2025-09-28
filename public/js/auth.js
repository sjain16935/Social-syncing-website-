// Authentication manager
const CONFIG = {
  STORAGE_KEYS: {
    TOKEN: "auth_token",
    USER: "auth_user",
  },
}

const api = {
  setToken: (token) => {
    // Implementation for setting token
  },
  login: async (email, password) => {
    // Implementation for login
    return { success: true, user: { name: "John Doe", email: "john@example.com" } }
  },
  register: async (userData) => {
    // Implementation for register
    return { success: true, user: { name: userData.name, email: userData.email } }
  },
  logout: async () => {
    // Implementation for logout
  },
}

const showNotification = (message, type) => {
  // Implementation for showing notification
  console.log(`Notification (${type}): ${message}`)
}

class AuthManager {
  constructor() {
    this.currentUser = null
    this.init()
  }

  init() {
    this.loadUserFromStorage()
    this.updateNavigation()
  }

  loadUserFromStorage() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN)
    const userData = localStorage.getItem(CONFIG.STORAGE_KEYS.USER)

    if (token && userData) {
      try {
        this.currentUser = JSON.parse(userData)
        api.setToken(token)
      } catch (error) {
        console.error("Error parsing user data:", error)
        this.logout()
      }
    }
  }

  async login(email, password) {
    try {
      const response = await api.login(email, password)
      if (response.success) {
        this.currentUser = response.user
        this.updateNavigation()
      }
      return response
    } catch (error) {
      throw error
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData)
      if (response.success) {
        this.currentUser = response.user
        this.updateNavigation()
      }
      return response
    } catch (error) {
      throw error
    }
  }

  async logout() {
    try {
      await api.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      this.currentUser = null
      this.updateNavigation()

      // Redirect to home if on protected page
      const protectedPages = ["dashboard", "create-event"]
      const currentPage = window.location.pathname
      if (protectedPages.some((page) => currentPage.includes(page))) {
        window.location.href = "/"
      }
    }
  }

  updateNavigation() {
    const navButtons = document.getElementById("nav-buttons")
    if (!navButtons) return

    if (this.currentUser) {
      navButtons.innerHTML = `
        <div class="user-menu">
          <div class="user-avatar" onclick="toggleUserDropdown()">
            ${this.currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div class="user-dropdown" id="user-dropdown">
            <div class="user-info">
              <strong>${this.currentUser.name}</strong>
              <span>${this.currentUser.email}</span>
            </div>
            <div class="dropdown-divider"></div>
            <a href="/dashboard">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
            <a href="/create-event">
              <i class="fas fa-plus"></i>
              Create Event
            </a>
            <a href="/events">
              <i class="fas fa-calendar"></i>
              Browse Events
            </a>
            <div class="dropdown-divider"></div>
            <a href="#" onclick="auth.logout()">
              <i class="fas fa-sign-out-alt"></i>
              Logout
            </a>
          </div>
        </div>
      `
    } else {
      navButtons.innerHTML = `
        <button class="btn btn-ghost" onclick="showAuthModal('login')">Sign In</button>
        <button class="btn btn-primary" onclick="showAuthModal('signup')">Get Started</button>
      `
    }
  }

  isAuthenticated() {
    return !!this.currentUser
  }

  requireAuth() {
    if (!this.isAuthenticated()) {
      showAuthModal("login")
      return false
    }
    return true
  }

  getCurrentUser() {
    return this.currentUser
  }
}

// Initialize auth manager
const auth = new AuthManager()

// Auth modal functions
function showAuthModal(type = "login") {
  const modal = document.getElementById("auth-modal")
  const loginForm = document.getElementById("login-form")
  const signupForm = document.getElementById("signup-form")

  if (type === "login") {
    loginForm.style.display = "block"
    signupForm.style.display = "none"
  } else {
    loginForm.style.display = "none"
    signupForm.style.display = "block"
  }

  modal.style.display = "block"
  document.body.style.overflow = "hidden"
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal")
  modal.style.display = "none"
  document.body.style.overflow = "auto"
}

function switchToLogin() {
  showAuthModal("login")
}

function switchToSignup() {
  showAuthModal("signup")
}

function toggleUserDropdown() {
  const dropdown = document.getElementById("user-dropdown")
  if (dropdown) {
    dropdown.classList.toggle("show")
  }
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  const submitBtn = event.target.querySelector('button[type="submit"]')

  try {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...'

    await auth.login(email, password)

    closeAuthModal()
    showNotification("Welcome back!", "success")

    // Redirect to dashboard if on home page
    if (window.location.pathname === "/" || window.location.pathname.includes("index.html")) {
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    }
  } catch (error) {
    showNotification(error.message || "Login failed", "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = "Sign In"
  }
}

// Handle signup form submission
async function handleSignup(event) {
  event.preventDefault()

  const name = document.getElementById("signup-name").value
  const email = document.getElementById("signup-email").value
  const phone = document.getElementById("signup-phone").value
  const password = document.getElementById("signup-password").value
  const submitBtn = event.target.querySelector('button[type="submit"]')

  try {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...'

    await auth.register({ name, email, phone, password })

    closeAuthModal()
    showNotification("Account created successfully!", "success")

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 1000)
  } catch (error) {
    showNotification(error.message || "Registration failed", "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = "Create Account"
  }
}

// Event listeners
document.addEventListener("click", (event) => {
  const userMenu = document.querySelector(".user-menu")
  const dropdown = document.getElementById("user-dropdown")

  if (userMenu && dropdown && !userMenu.contains(event.target)) {
    dropdown.classList.remove("show")
  }
})

window.addEventListener("click", (event) => {
  const modal = document.getElementById("auth-modal")
  if (event.target === modal) {
    closeAuthModal()
  }
})
