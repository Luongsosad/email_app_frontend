import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { validateEmail } from '@/lib/utils/utils'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email')
      return
    }

    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-2xl text-primary-foreground font-bold">🔐</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2 text-center text-primary">Reset Password</h1>
          <p className="text-muted-foreground text-center mb-6">Enter your email address and we'll send you a link to reset your password.</p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {submitted ? (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary font-medium">✓ Check your email inbox for a password reset link.</p>
            </div>
          ) : (
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
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition"
              >
                Send Reset Link
              </button>
            </form>
          )}

          <button
            onClick={() => navigate('/login')}
            className="w-full mt-4 text-primary text-sm font-medium hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
