// Import necessary modules
const auth = require("./auth") // Placeholder for actual import
const utils = require("./utils") // Placeholder for actual import
const CONFIG = require("./config") // Placeholder for actual import

// Login page functionality
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  if (auth.isAuthenticated()) {
    window.location.href = "/dashboard"
    return
  }

  // Handle login form submission
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Handle remember me functionality
  loadRememberedCredentials()
})

async function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const remember = document.getElementById("remember").checked
  const submitBtn = document.getElementById("login-btn")

  // Validate form
  if (!utils.validateEmail(email)) {
    utils.showNotification("Please enter a valid email address", "error")
    return
  }

  if (password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
    utils.showNotification(
      `Password must be at least ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
      "error",
    )
    return
  }

  try {
    // Update button state
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...'

    // Attempt login
    const response = await auth.login({ email, password })

    // Handle remember me
    if (remember) {
      localStorage.setItem("remembered_email", email)
    } else {
      localStorage.removeItem("remembered_email")
    }

    utils.showNotification("Welcome back!", "success")

    // Redirect based on user type or intended destination
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get("redirect") || "/dashboard"

    setTimeout(() => {
      window.location.href = redirect
    }, 1000)
  } catch (error) {
    utils.showNotification(error.message || "Login failed", "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In'
  }
}

function loadRememberedCredentials() {
  const rememberedEmail = localStorage.getItem("remembered_email")
  if (rememberedEmail) {
    document.getElementById("email").value = rememberedEmail
    document.getElementById("remember").checked = true
  }
}

// Social login functions
async function loginWithGoogle() {
  utils.showNotification("Google login will be available soon!", "info")
  // TODO: Implement Google OAuth
}

async function loginWithFacebook() {
  utils.showNotification("Facebook login will be available soon!", "info")
  // TODO: Implement Facebook OAuth
}

// Handle forgot password
function handleForgotPassword() {
  const email = document.getElementById("email").value
  if (email && utils.validateEmail(email)) {
    // TODO: Implement forgot password functionality
    utils.showNotification("Password reset link will be sent to your email", "info")
  } else {
    utils.showNotification("Please enter your email address first", "warning")
  }
}
