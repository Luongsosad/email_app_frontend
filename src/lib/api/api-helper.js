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

    // If 401 and not already refreshing and not a refresh/login/register endpoint
    if (response.status === 401 && !isRefreshing && 
        !endpoint.includes('/auth/refresh') && 
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register')) {
      
      const refreshToken = getCookie('refresh_token')
      
      if (refreshToken) {
        isRefreshing = true

        try {
          // Try to refresh token
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
              onTokenRefreshed(newAccessToken)

              // Retry original request with new token
              const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                  ...options.headers,
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${newAccessToken}`,
                },
              })

              const retryData = await retryResponse.json()

              if (!retryResponse.ok) {
                throw new Error(retryData.message || retryData.error || 'API request failed')
              }

              return { success: true, data: retryData.data || retryData }
            }
          }
          
          // Refresh failed - clear tokens and redirect to login
          isRefreshing = false
          clearTokens()
          window.location.href = '/login'
          throw new Error('Session expired. Please login again.')
        } catch (refreshError) {
          isRefreshing = false
          clearTokens()
          window.location.href = '/login'
          throw new Error('Session expired. Please login again.')
        }
      } else {
        // No refresh token - redirect to login
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
    return { success: true, data: responseData.data || responseData }
  } catch (error) {
    console.error('API call error:', error)
    return { success: false, error: error.message }
  }
}
