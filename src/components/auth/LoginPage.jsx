import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { validateEmail } from '@/lib/utils/utils'
import { authService } from '@/lib/services/auth.service'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    try {
      const result = await authService.login(email, password)
      
      if (result.success && result.data) {
        const userData = {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name || result.data.user.email.split('@')[0],
        }
        toast({
          title: 'Welcome back!',
          description: `Successfully logged in as ${userData.name}`,
          variant: 'success',
        })
        onLoginSuccess(userData)
        navigate('/dashboard')
      } else {
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid email or password',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Network Error',
        description: 'Unable to connect. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    
    try {
      const result = await authService.loginWithGoogle(credentialResponse.credential)
      
      if (result.success && result.data) {
        const userData = {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name || result.data.user.email.split('@')[0],
        }
        toast({
          title: 'Google Sign-In Successful',
          description: `Welcome ${userData.name}!`,
          variant: 'success',
        })
        onLoginSuccess(userData)
        navigate('/dashboard')
      } else {
        toast({
          title: 'Google Sign-In Failed',
          description: result.error || 'Google authentication failed',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Google Sign-In Failed',
        description: 'Unable to sign in with Google. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    toast({
      title: 'Sign-in Cancelled',
      description: 'Google sign-in was cancelled',
      variant: 'default',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl text-primary-foreground font-bold">📧</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-center text-primary">ProMail</h1>
          <p className="text-muted-foreground text-center mb-6">Professional Email Management</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-4 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-3 text-sm text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="384"
            />
          </div>

          <p className="text-center text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign Up
            </Link>
          </p>

          <p className="text-center text-sm mt-2">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-primary transition">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
