// Authentication service
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, setTokens, clearTokens, setUser } from '../api/api-config'
import { setCookie } from '../utils/cookie'
import { apiCall } from '../api/api-helper'

// Authentication APIs
export const authService = {
  // Register new user
  register: async (email, password, name) => {
    const result = await apiCall(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })

    if (result.success && result.data) {
      const { accessToken, refreshToken, user } = result.data
      setTokens(accessToken, refreshToken)
      setUser(user)
    }

    return result
  },

  // Login user
  login: async (email, password) => {
    const result = await apiCall(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (result.success && result.data) {
      const { accessToken, refreshToken, user } = result.data
      setTokens(accessToken, refreshToken)
      setUser(user)
    }

    return result
  },

  // Google login
  loginWithGoogle: async (googleToken) => {
    const result = await apiCall(API_ENDPOINTS.AUTH.GOOGLE, {
      method: 'POST',
      body: JSON.stringify({ token: googleToken }),
    })

    if (result.success && result.data) {
      const { accessToken, refreshToken, user } = result.data
      setTokens(accessToken, refreshToken)
      setUser(user)
    }

    return result
  },

  // Logout
  logout: async () => {
    const result = await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    })

    clearTokens()
    return result
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const result = await apiCall(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    if (result.success && result.data) {
      const { accessToken } = result.data
      // Update only access token in cookies
      setCookie('access_token', accessToken, 1)
    }

    return result
  },
}
