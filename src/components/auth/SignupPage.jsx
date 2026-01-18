import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { validateEmail } from '@/lib/utils/utils'
import { authService } from '@/lib/services/auth.service'
import { useToast } from '@/hooks/use-toast'

export default function SignupPage({ onSignupSuccess }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    try {
      const result = await authService.register(formData.email, formData.password, formData.name)
      
      if (result.success && result.data) {
        const userData = {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name || formData.name,
        }
        toast({
          title: 'Account Created!',
          description: `Welcome to ProMail, ${userData.name}`,
          variant: 'success',
        })
        onSignupSuccess(userData)
        navigate('/dashboard')
      } else {
        const errorMsg = result.error || 'Registration failed'
        toast({
          title: 'Registration Failed',
          description: errorMsg.includes('already') ? 'This email is already registered' : errorMsg,
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

          <h1 className="text-3xl font-bold mb-2 text-center text-gradient tracking-tight">Create Account</h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">Join ProMail today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-foreground">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground py-2.5 rounded-xl font-semibold hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover-glow mt-2"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
