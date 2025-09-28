// Create event page functionality
let selectedTags = []
let uploadedImage = null
const auth = { requireAuth: () => true } // Placeholder for auth variable
const CONFIG = {
  UPLOAD: {
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  },
  COMMISSION_RATE: 0.1, // Placeholder for commission rate
} // Placeholder for CONFIG variable
const api = {
  uploadImage: async (file) => {
    // Placeholder for uploadImage function
    return { success: true, image: { url: "https://example.com/image.jpg" } }
  },
  createEvent: async (eventData) => {
    // Placeholder for createEvent function
    return { success: true, event: { _id: "12345" } }
  },
} // Placeholder for api variable
const showNotification = (message, type) => {
  // Placeholder for showNotification function
  console.log(`Notification (${type}): ${message}`)
} // Placeholder for showNotification variable

document.addEventListener("DOMContentLoaded", () => {
  initializeCreateEventPage()
  setTimeout(loadDraft, 500) // Small delay to ensure form is ready
})

function initializeCreateEventPage() {
  // Check authentication
  if (!auth.requireAuth()) {
    return
  }

  setupFormValidation()
  setupImageUpload()
  setupTagInput()
  setupCommissionCalculator()
  setupFormSubmission()

  // Set minimum date to today
  const dateInput = document.getElementById("date")
  if (dateInput) {
    const today = new Date().toISOString().split("T")[0]
    dateInput.min = today
  }
}

function setupFormValidation() {
  const form = document.getElementById("create-event-form")
  if (!form) return

  // Real-time validation
  const inputs = form.querySelectorAll("input, select, textarea")
  inputs.forEach((input) => {
    input.addEventListener("blur", validateField)
    input.addEventListener("input", clearFieldError)
  })
}

function validateField(event) {
  const field = event.target
  const value = field.value.trim()

  clearFieldError(event)

  // Required field validation
  if (field.hasAttribute("required") && !value) {
    showFieldError(field, "This field is required")
    return false
  }

  // Specific field validations
  switch (field.id) {
    case "title":
      if (value.length < 5) {
        showFieldError(field, "Title must be at least 5 characters long")
        return false
      }
      break

    case "description":
      if (value.length < 20) {
        showFieldError(field, "Description must be at least 20 characters long")
        return false
      }
      break

    case "price":
      if (value < 0) {
        showFieldError(field, "Price cannot be negative")
        return false
      }
      break

    case "capacity":
      if (value < 1) {
        showFieldError(field, "Capacity must be at least 1")
        return false
      }
      if (value > 10000) {
        showFieldError(field, "Capacity cannot exceed 10,000")
        return false
      }
      break

    case "date":
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        showFieldError(field, "Event date cannot be in the past")
        return false
      }
      break
  }

  return true
}

function showFieldError(field, message) {
  clearFieldError({ target: field })

  const errorElement = document.createElement("div")
  errorElement.className = "field-error"
  errorElement.textContent = message

  field.parentNode.appendChild(errorElement)
  field.classList.add("error")
}

function clearFieldError(event) {
  const field = event.target
  const existingError = field.parentNode.querySelector(".field-error")

  if (existingError) {
    existingError.remove()
  }

  field.classList.remove("error")
}

function setupImageUpload() {
  const imageInput = document.getElementById("image-input")
  const imageUpload = document.getElementById("image-upload")
  const imagePreview = document.getElementById("image-preview")

  if (!imageInput || !imageUpload || !imagePreview) return

  imageInput.addEventListener("change", handleImageUpload)
}

async function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file
  if (!CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
    showNotification("Please select a valid image file (JPEG, PNG, or WebP)", "error")
    return
  }

  if (file.size > CONFIG.UPLOAD.MAX_FILE_SIZE) {
    showNotification("Image size must be less than 5MB", "error")
    return
  }

  try {
    // Show loading state
    const uploadArea = document.querySelector(".image-upload-area")
    uploadArea.innerHTML = `
      <div class="upload-loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Uploading image...</p>
      </div>
    `

    // Upload image
    const response = await api.uploadImage(file)

    if (response.success) {
      uploadedImage = response.image
      showImagePreview(response.image.url)
      showNotification("Image uploaded successfully", "success")
    } else {
      throw new Error(response.message || "Upload failed")
    }
  } catch (error) {
    console.error("Image upload error:", error)
    showNotification("Failed to upload image. Please try again.", "error")
    resetImageUpload()
  }
}

function showImagePreview(imageUrl) {
  const imageUpload = document.getElementById("image-upload")
  const imagePreview = document.getElementById("image-preview")
  const previewImg = document.getElementById("preview-img")

  if (imageUpload && imagePreview && previewImg) {
    previewImg.src = imageUrl
    imageUpload.style.display = "none"
    imagePreview.style.display = "block"
  }
}

function removeImage() {
  uploadedImage = null
  resetImageUpload()
}

function resetImageUpload() {
  const imageInput = document.getElementById("image-input")
  const imageUpload = document.getElementById("image-upload")
  const imagePreview = document.getElementById("image-preview")

  if (imageInput) imageInput.value = ""

  if (imageUpload) {
    imageUpload.style.display = "block"
    imageUpload.querySelector(".image-upload-area").innerHTML = `
      <i class="fas fa-cloud-upload-alt"></i>
      <p>Upload an event banner or image</p>
      <small>Recommended size: 1200x600px (Max: 5MB)</small>
    `
  }

  if (imagePreview) {
    imagePreview.style.display = "none"
  }
}

function setupTagInput() {
  const tagInput = document.getElementById("tag-input")
  if (!tagInput) return

  tagInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault()
      addTag()
    }
  })
}

function addTag() {
  const tagInput = document.getElementById("tag-input")
  const tagsContainer = document.getElementById("tags-container")

  if (!tagInput || !tagsContainer) return

  const tagValue = tagInput.value.trim()

  if (!tagValue) return

  if (selectedTags.includes(tagValue)) {
    showNotification("Tag already added", "warning")
    return
  }

  if (selectedTags.length >= 10) {
    showNotification("Maximum 10 tags allowed", "warning")
    return
  }

  selectedTags.push(tagValue)

  const tagElement = document.createElement("div")
  tagElement.className = "tag-item"
  tagElement.innerHTML = `
    <span>${tagValue}</span>
    <button type="button" onclick="removeTag('${tagValue}')" class="remove-tag">
      <i class="fas fa-times"></i>
    </button>
  `

  tagsContainer.appendChild(tagElement)
  tagInput.value = ""
}

function removeTag(tagValue) {
  selectedTags = selectedTags.filter((tag) => tag !== tagValue)

  const tagsContainer = document.getElementById("tags-container")
  if (tagsContainer) {
    const tagElements = tagsContainer.querySelectorAll(".tag-item")
    tagElements.forEach((element) => {
      if (element.querySelector("span").textContent === tagValue) {
        element.remove()
      }
    })
  }
}

function setupCommissionCalculator() {
  const priceInput = document.getElementById("price")
  if (!priceInput) return

  priceInput.addEventListener("input", updateCommissionCalculation)
  updateCommissionCalculation() // Initial calculation
}

function updateCommissionCalculation() {
  const priceInput = document.getElementById("price")
  const calculationElement = document.getElementById("commission-calculation")

  if (!priceInput || !calculationElement) return

  const price = Number.parseFloat(priceInput.value) || 0
  const commission = Math.round(price * CONFIG.COMMISSION_RATE)
  const hostEarnings = price - commission

  if (price === 0) {
    calculationElement.textContent = "For a free event, no commission is charged."
  } else {
    calculationElement.innerHTML = `
      For a ₹${price} ticket, you'll receive ₹${hostEarnings} per sale 
      (₹${commission} platform commission).
    `
  }
}

function setupFormSubmission() {
  const form = document.getElementById("create-event-form")
  if (form) {
    form.addEventListener("submit", handleFormSubmit)
  }
}

async function handleFormSubmit(event) {
  event.preventDefault()

  // Validate all fields
  const form = event.target
  const inputs = form.querySelectorAll("input[required], select[required], textarea[required]")
  let isValid = true

  inputs.forEach((input) => {
    if (!validateField({ target: input })) {
      isValid = false
    }
  })

  if (!isValid) {
    showNotification("Please fix the errors in the form", "error")
    return
  }

  // Collect form data
  const formData = new FormData(form)
  const eventData = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    date: formData.get("date"),
    time: formData.get("time"),
    location: {
      city: formData.get("city"),
      venue: formData.get("venue"),
      address: formData.get("address"),
    },
    price: Number.parseFloat(formData.get("price")) || 0,
    capacity: Number.parseInt(formData.get("capacity")),
    tags: selectedTags,
    coverImage: uploadedImage,
    settings: {
      isPrivate: formData.get("private") === "on",
      requiresApproval: formData.get("approval") === "on",
    },
  }

  const submitBtn = form.querySelector('button[type="submit"]')
  const originalText = submitBtn.innerHTML

  try {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Event...'
    submitBtn.disabled = true

    const response = await api.createEvent(eventData)

    if (response.success) {
      showNotification("Event created successfully!", "success")

      // Redirect to event details or dashboard
      setTimeout(() => {
        window.location.href = `/event-details?id=${response.event._id}`
      }, 2000)
    } else {
      throw new Error(response.message || "Failed to create event")
    }
  } catch (error) {
    console.error("Error creating event:", error)
    showNotification(error.message || "Failed to create event. Please try again.", "error")
  } finally {
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false
  }
}

async function saveDraft() {
  // Implementation for saving draft
  showNotification("Draft saved locally", "info")

  // Save form data to localStorage
  const form = document.getElementById("create-event-form")
  if (form) {
    const formData = new FormData(form)
    const draftData = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      date: formData.get("date"),
      time: formData.get("time"),
      city: formData.get("city"),
      venue: formData.get("venue"),
      address: formData.get("address"),
      price: formData.get("price"),
      capacity: formData.get("capacity"),
      tags: selectedTags,
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem("sync_event_draft", JSON.stringify(draftData))
  }
}

// Load draft on page load
function loadDraft() {
  const draftData = localStorage.getItem("sync_event_draft")
  if (!draftData) return

  try {
    const draft = JSON.parse(draftData)

    // Populate form fields
    Object.keys(draft).forEach((key) => {
      const field = document.getElementById(key)
      if (field && draft[key]) {
        field.value = draft[key]
      }
    })

    // Restore tags
    if (draft.tags && Array.isArray(draft.tags)) {
      selectedTags = [...draft.tags]
      const tagsContainer = document.getElementById("tags-container")
      if (tagsContainer) {
        tagsContainer.innerHTML = ""
        selectedTags.forEach((tag) => {
          const tagElement = document.createElement("div")
          tagElement.className = "tag-item"
          tagElement.innerHTML = `
            <span>${tag}</span>
            <button type="button" onclick="removeTag('${tag}')" class="remove-tag">
              <i class="fas fa-times"></i>
            </button>
          `
          tagsContainer.appendChild(tagElement)
        })
      }
    }

    showNotification("Draft loaded", "info")
  } catch (error) {
    console.error("Error loading draft:", error)
  }
}
