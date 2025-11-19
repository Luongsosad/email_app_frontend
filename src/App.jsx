import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import ForgotPasswordPage from './components/auth/ForgotPasswordPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'
import DashboardPage from './components/dashboard/DashboardPage'
import { Toaster } from './components/ui/toaster'
import { getUser, clearTokens } from './lib/api/api-config'
import { authService } from './lib/services/auth.service'
import { useToast } from './hooks/use-toast'
import './App.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  const { toast } = useToast()
  const [user, setUser] = useState(null)

  // Load user from cookie on mount
  useEffect(() => {
    const storedUser = getUser()
    if (storedUser) {
      setUser(storedUser)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleSignup = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
        variant: 'default',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginPage onLoginSuccess={handleLogin} />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignupPage onSignupSuccess={handleSignup} />
            </PublicRoute>
          } 
        />
        <Route 
          path="/forgot-password" 
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
        <Toaster />
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
