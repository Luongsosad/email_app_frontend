import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setTokens, setUser } from '@/lib/api/api-config'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback({ onLoginSuccess }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken')
      const refreshToken = searchParams.get('refreshToken')

      if (!accessToken || !refreshToken) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid authentication response',
          variant: 'destructive',
        })
        navigate('/login')
        return
      }

      try {
        // Decode JWT to get user info
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        
        const userData = {
          id: payload.userId,
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
        }

        // Save tokens and user data
        setTokens(accessToken, refreshToken)
        setUser(userData)

        toast({
          title: 'Login Successful',
          description: `Welcome ${userData.name}!`,
          variant: 'success',
        })

        onLoginSuccess(userData)
        navigate('/dashboard')
      } catch (error) {
        console.error('Error processing auth callback:', error)
        toast({
          title: 'Authentication Error',
          description: 'Failed to process authentication. Please try again.',
          variant: 'destructive',
        })
        navigate('/login')
      } finally {
        setProcessing(false)
      }
    }

    handleCallback()
  }, [searchParams, navigate, toast, onLoginSuccess])

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-primary-foreground font-bold">📧</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
          <p className="text-muted-foreground">Please wait while we complete your sign-in.</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
