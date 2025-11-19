import { useState, useCallback } from 'react'
import { authApi } from '../lib/api'

export function useAuth() {
  const [authState, setAuthState] = useState({
    user: null,
    isLoading: false,
    error: null,
  })

  const login = useCallback(async (email, password) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.login(email, password)
      if (response.success && response.data) {
        setAuthState({ user: response.data, isLoading: false, error: null })
        return { success: true, user: response.data }
      }
      setAuthState(prev => ({ ...prev, error: response.error }))
      return { success: false, error: response.error }
    } catch (err) {
      const error = 'Login failed'
      setAuthState(prev => ({ ...prev, error }))
      return { success: false, error }
    }
  }, [])

  const signup = useCallback(async (email, password, name) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.signup(email, password, name)
      if (response.success && response.data) {
        setAuthState({ user: response.data, isLoading: false, error: null })
        return { success: true, user: response.data }
      }
      setAuthState(prev => ({ ...prev, error: response.error }))
      return { success: false, error: response.error }
    } catch (err) {
      const error = 'Signup failed'
      setAuthState(prev => ({ ...prev, error }))
      return { success: false, error }
    }
  }, [])

  const loginWithGoogle = useCallback(async (googleToken) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await authApi.loginWithGoogle(googleToken)
      if (response.success && response.data) {
        setAuthState({ user: response.data, isLoading: false, error: null })
        return { success: true, user: response.data }
      }
      setAuthState(prev => ({ ...prev, error: response.error }))
      return { success: false, error: response.error }
    } catch (err) {
      const error = 'Google login failed'
      setAuthState(prev => ({ ...prev, error }))
      return { success: false, error }
    }
  }, [])

  const logout = useCallback(() => {
    setAuthState({ user: null, isLoading: false, error: null })
  }, [])

  return { ...authState, login, signup, loginWithGoogle, logout }
}
