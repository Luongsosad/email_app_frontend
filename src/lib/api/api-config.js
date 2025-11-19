import { setCookie, getCookie, deleteCookie } from '../utils/cookie'

// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
  },
  // Mailbox endpoints
  MAILBOXES: {
    LIST: '/mailboxes',
    CREATE: '/mailboxes',
    GET: (id) => `/mailboxes/${id}`,
    UPDATE: (id) => `/mailboxes/${id}`,
    DELETE: (id) => `/mailboxes/${id}`,
  },
  // Email endpoints
  EMAILS: {
    LIST: (mailboxId) => `/mailboxes/${mailboxId}/emails`,
    GET: (id) => `/emails/${id}`,
    SEND: '/emails/send',
    UPDATE: (id) => `/emails/${id}`,
    DELETE: (id) => `/emails/${id}`,
  },
}

// HTTP headers
export const getAuthHeaders = () => {
  const token = getCookie('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Store tokens
export const setTokens = (accessToken, refreshToken) => {
  setCookie('access_token', accessToken, 1) // 1 day for access token
  setCookie('refresh_token', refreshToken, 7) // 7 days for refresh token
}

// Get tokens
export const getTokens = () => ({
  accessToken: getCookie('access_token'),
  refreshToken: getCookie('refresh_token'),
})

// Clear tokens
export const clearTokens = () => {
  deleteCookie('access_token')
  deleteCookie('refresh_token')
  deleteCookie('user')
}

// Store user
export const setUser = (user) => {
  setCookie('user', JSON.stringify(user), 7)
}

// Get user
export const getUser = () => {
  const user = getCookie('user')
  if (!user || user === 'undefined' || user === 'null') {
    return null
  }
  try {
    return JSON.parse(user)
  } catch (error) {
    console.error('Error parsing user data:', error)
    return null
  }
}
