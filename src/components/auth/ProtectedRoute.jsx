import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCookie } from '../../lib/utils/cookie'
import { authService } from '../../lib/services/auth.service'
import { setTokens, clearTokens, setUser, getUser } from '../../lib/api/api-config'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = getCookie('access_token')
      const refreshToken = getCookie('refresh_token')

      // Nếu có access token -> user đã authenticated
      if (accessToken) {
        setIsAuthenticated(true)
        setIsChecking(false)
        return
      }

      // Nếu không có access token nhưng có refresh token -> thử refresh
      if (refreshToken) {
        try {
          const result = await authService.refreshToken(refreshToken)
          
          if (result.success && result.data && result.data.accessToken) {
            // Refresh thành công
            const { accessToken: newAccessToken } = result.data
            setTokens(newAccessToken, refreshToken)
            
            // Giữ lại thông tin user từ cookie nếu có
            const storedUser = getUser()
            if (storedUser) {
              setUser(storedUser)
            }
            
            setIsAuthenticated(true)
            setIsChecking(false)
            return
          } else {
            // Refresh thất bại
            clearTokens()
            setIsAuthenticated(false)
            setIsChecking(false)
            return
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          clearTokens()
          setIsAuthenticated(false)
          setIsChecking(false)
          return
        }
      }

      // Không có token
      clearTokens()
      setIsAuthenticated(false)
      setIsChecking(false)
    }

    checkAuth()
  }, [])

  // Đang kiểm tra authentication
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Nếu không authenticated -> redirect về login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated -> render children
  return children
}

export default ProtectedRoute
