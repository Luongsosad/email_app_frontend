// API helper functions
import { API_BASE_URL, getAuthHeaders, setTokens, clearTokens } from './api-config'
import { getCookie } from '../utils/cookie'

let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

const onRefreshFailed = (error) => {
  refreshSubscribers.forEach(callback => callback(null, error))
  refreshSubscribers = []
}

// Helper to check if endpoint is auth-related (should not trigger refresh)
const isAuthEndpoint = (endpoint) => {
  return endpoint.includes('/auth/refresh') || 
         endpoint.includes('/auth/login') ||
         endpoint.includes('/auth/register')
}

// Helper to retry request with new token
const retryRequestWithToken = async (endpoint, options, newToken) => {
  const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newToken}`,
    },
  })

  const retryData = await retryResponse.json()

  if (!retryResponse.ok) {
    throw new Error(retryData.message || retryData.error || 'API request failed')
  }

  return { success: true, data: retryData.data || retryData }
}

// Helper function for API calls with auto token refresh
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    })

    // Handle 401 Unauthorized (except for auth endpoints)
    if (response.status === 401 && !isAuthEndpoint(endpoint)) {
      const refreshToken = getCookie('refresh_token')

      if (!refreshToken) {
        // No refresh token - redirect to login
        clearTokens()
        window.location.href = '/login'
        throw new Error('Session expired. Please login again.')
      }

      // Case 1: Another request is already refreshing the token
      // Subscribe to the queue and wait for the new token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken, error) => {
            if (error || !newToken) {
              reject(new Error('Session expired. Please login again.'))
              return
            }
            try {
              const result = await retryRequestWithToken(endpoint, options, newToken)
              resolve(result)
            } catch (retryError) {
              reject(retryError)
            }
          })
        })
      }

      // Case 2: First request to hit 401 - initiate the refresh
      isRefreshing = true

      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          const newAccessToken = refreshData.data?.accessToken || refreshData.accessToken

          if (newAccessToken) {
            // Update tokens
            setTokens(newAccessToken, refreshToken)
            isRefreshing = false
            
            // Notify all waiting requests with new token
            onTokenRefreshed(newAccessToken)

            // Retry original request with new token
            return await retryRequestWithToken(endpoint, options, newAccessToken)
          }
        }

        // Refresh failed - notify all waiting requests and redirect
        isRefreshing = false
        onRefreshFailed(new Error('Refresh failed'))
        clearTokens()
        window.location.href = '/login'
        throw new Error('Session expired. Please login again.')
      } catch (refreshError) {
        isRefreshing = false
        onRefreshFailed(refreshError)
        clearTokens()
        window.location.href = '/login'
        throw new Error('Session expired. Please login again.')
      }
    }

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.message || responseData.error || 'API request failed')
    }

    // Backend wraps response in { status, code, message, data, meta }
    const result = { success: true, data: responseData.data || responseData }
    return result
  } catch (error) {
    console.error('API call error:', error)
    return { success: false, error: error.message }
  }
}
