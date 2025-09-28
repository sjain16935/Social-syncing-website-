// Signup page functionality
const auth = {} // Declare auth variable
const utils = {} // Declare utils variable
const CONFIG = { VALIDATION: { MIN_PASSWORD_LENGTH: 8 } } // Declare CONFIG variable

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  if (auth.isAuthenticated()) {
    window.location.href = "/dashboard"
    return
  }

  // Handle signup form submission
  const signupForm = document.getElementById("signup-form")
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup)
  }

  // Add password confirmation validation
  const confirmPassword = document.getElementById("confirmPassword")
  if (confirmPassword) {
    confirmPassword.addEventListener("blur", validatePasswordMatch)
  }

  // Add real-time validation
  addRealTimeValidation()
})

async function handleSignup(event) {
  event.preventDefault()

  const formData = new FormData(event.target)
  const userData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    city: formData.get("city"),
    isHost: formData.get("isHost") === "on",
    newsletter: formData.get("newsletter") === "on",
  }

  const submitBtn = document.getElementById("signup-btn")

  // Validate form
  if (!validateSignupForm(userData)) {
    return
  }

  try {
    // Update button state
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...'

    // Create account
    const response = await auth.register({
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      phone: userData.phone,
      password: userData.password,
      city: userData.city,
      isHost: userData.isHost,
      newsletter: userData.newsletter,
    })

    utils.showNotification("Account created successfully! Welcome to Sync!", "success")

    // Redirect to dashboard
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 1000)
  } catch (error) {
    utils.showNotification(error.message || "Registration failed", "error")
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account'
  }
}

function validateSignupForm(userData) {
  // Name validation
  if (!userData.firstName.trim() || !userData.lastName.trim()) {
    utils.showNotification("Please enter your full name", "error")
    return false
  }

  // Email validation
  if (!utils.validateEmail(userData.email)) {
    utils.showNotification("Please enter a valid email address", "error")
    return false
  }

  // Phone validation
  if (!utils.validatePhone(userData.phone)) {
    utils.showNotification("Please enter a valid 10-digit phone number", "error")
    return false
  }

  // Password validation
  if (userData.password.length < CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
    utils.showNotification(
      `Password must be at least ${CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
      "error",
    )
    return false
  }

  // Password confirmation
  if (userData.password !== userData.confirmPassword) {
    utils.showNotification("Passwords do not match", "error")
    return false
  }

  // City validation
  if (!userData.city) {
    utils.showNotification("Please select your city", "error")
    return false
  }

  // Terms acceptance
  const termsAccepted = document.getElementById("terms").checked
  if (!termsAccepted) {
    utils.showNotification("Please accept the Terms of Service and Privacy Policy", "error")
    return false
  }

  return true
}

function validatePasswordMatch() {
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const confirmField = document.getElementById("confirmPassword")

  if (confirmPassword && password !== confirmPassword) {
    confirmField.setCustomValidity("Passwords do not match")
    confirmField.style.borderColor = "#dc3545"
  } else {
    confirmField.setCustomValidity("")
    confirmField.style.borderColor = "#e9ecef"
  }
}

function addRealTimeValidation() {
  // Email validation
  const emailField = document.getElementById("email")
  if (emailField) {
    emailField.addEventListener("blur", function () {
      if (this.value && !utils.validateEmail(this.value)) {
        this.style.borderColor = "#dc3545"
        utils.showNotification("Please enter a valid email address", "warning")
      } else {
        this.style.borderColor = "#e9ecef"
      }
    })
  }

  // Phone validation
  const phoneField = document.getElementById("phone")
  if (phoneField) {
    phoneField.addEventListener("input", function () {
      // Format phone number as user types
      let value = this.value.replace(/\D/g, "")
      if (value.length > 10) value = value.substring(0, 10)
      this.value = value
    })

    phoneField.addEventListener("blur", function () {
      if (this.value && !utils.validatePhone(this.value)) {
        this.style.borderColor = "#dc3545"
      } else {
        this.style.borderColor = "#e9ecef"
      }
    })
  }

  // Password strength indicator
  const passwordField = document.getElementById("password")
  if (passwordField) {
    passwordField.addEventListener("input", function () {
      const strength = calculatePasswordStrength(this.value)
      showPasswordStrength(strength)
    })
  }
}

function calculatePasswordStrength(password) {
  let strength = 0

  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  return strength
}

function showPasswordStrength(strength) {
  const strengthIndicator = document.getElementById("password-strength") || createPasswordStrengthIndicator()

  const levels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
  const colors = ["#dc3545", "#fd7e14", "#ffc107", "#28a745", "#20c997"]

  strengthIndicator.textContent = levels[strength] || "Very Weak"
  strengthIndicator.style.color = colors[strength] || colors[0]
}

function createPasswordStrengthIndicator() {
  const passwordField = document.getElementById("password")
  const indicator = document.createElement("small")
  indicator.id = "password-strength"
  indicator.className = "form-help"
  passwordField.parentNode.appendChild(indicator)
  return indicator
}

// Social signup functions
async function signupWithGoogle() {
  utils.showNotification("Google signup will be available soon!", "info")
  // TODO: Implement Google OAuth
}

async function signupWithFacebook() {
  utils.showNotification("Facebook signup will be available soon!", "info")
  // TODO: Implement Facebook OAuth
}
