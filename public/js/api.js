// API service for Sync platform
const CONFIG = {
  API_BASE_URL: "https://api.syncplatform.com",
  STORAGE_KEYS: {
    TOKEN: "sync_token",
    USER: "sync_user",
  },
  ENDPOINTS: {
    LOGIN: "/login",
    REGISTER: "/register",
    LOGOUT: "/logout",
    PROFILE: "/profile",
  },
}

class APIService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL
    this.token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN)
  }

  // Set authentication token
  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token)
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN)
    }
  }

  // Get authentication headers
  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    return headers
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Authentication methods
  async login(email, password) {
    const response = await this.request(CONFIG.ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })

    if (response.success && response.token) {
      this.setToken(response.token)
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.user))
    }

    return response
  }

  async register(userData) {
    const response = await this.request(CONFIG.ENDPOINTS.REGISTER, {
      method: "POST",
      body: JSON.stringify(userData),
    })

    if (response.success && response.token) {
      this.setToken(response.token)
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.user))
    }

    return response
  }

  async logout() {
    try {
      await this.request(CONFIG.ENDPOINTS.LOGOUT, {
        method: "POST",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      this.setToken(null)
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER)
    }
  }

  async getProfile() {
    const response = await this.request(CONFIG.ENDPOINTS.PROFILE)
    return response
  }
}
