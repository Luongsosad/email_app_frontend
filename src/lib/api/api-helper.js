// API helper functions
import { API_BASE_URL, getAuthHeaders } from './api-config'
import { getCookie } from '../utils/cookie'

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    })

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
