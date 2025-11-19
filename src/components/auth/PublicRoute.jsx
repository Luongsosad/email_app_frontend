import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getCookie } from '../../lib/utils/cookie'

const PublicRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = getCookie('access_token')
      const refreshToken = getCookie('refresh_token')

      // Nếu có token -> đã đăng nhập
      if (accessToken || refreshToken) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      
      setIsChecking(false)
    }

    checkAuth()
  }, [])

  // Đang kiểm tra
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Nếu đã đăng nhập -> redirect về dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Chưa đăng nhập -> render children (login/signup page)
  return children
}

export default PublicRoute
