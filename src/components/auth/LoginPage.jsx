import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
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

  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_MAIL_SERVICE_LOGIN
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Simplified background elements - reduced animation for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/8 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/8 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 relative z-10">
        <div className="bg-card/90 rounded-2xl shadow-xl p-6 sm:p-8 border border-border/50">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 md:transition-transform md:duration-200 md:hover:scale-105">
              <span className="text-2xl text-primary-foreground font-bold">📧</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-center text-gradient tracking-tight">ProMail</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">Professional Email Management</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-2.5 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover-glow mt-2"
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
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex items-center justify-center gap-2 border border-border rounded-lg px-4 py-2.5 hover:bg-accent transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.27 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.13v2.84C3.96 20.53 7.61 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.13C1.43 8.55 1 10.22 1 12s.43 3.45 1.13 4.95l2.71-2.84z" fill="#FBBC05"/>
                <path d="M12 4.77c1.62 0 3.08.56 4.23 1.66l3.17-3.17C17.45 1.5 15.03.5 12 .5 7.61.5 3.96 2.97 2.13 6.05l2.71 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm">Sign in with Google</span>
            </button>
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
