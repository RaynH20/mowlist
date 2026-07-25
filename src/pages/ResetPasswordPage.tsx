import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Shield, Scissors, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user has a valid session (came from email link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidToken(true)
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error
      setSuccess(true)

      // Redirect after success
      setTimeout(() => {
        if (user?.role === 'provider') {
          navigate('/pro')
        } else {
          navigate('/dashboard')
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-[#22C55E]" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h1>
              <p className="text-slate-600 mb-6">
                Your password has been successfully reset. Redirecting you to your dashboard...
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-[#22C55E] hover:underline"
              >
                Go to Dashboard Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-red-200 rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
              <p className="text-slate-600 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
              >
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
              <div className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center">
                <Scissors className="text-white" size={20} />
              </div>
              <span className="text-[#22C55E]">Mow</span>
              <span className="text-[#1E40AF]">List</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2">Create New Password</h1>
            <p className="text-slate-600">Enter a new password for your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-3.5 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Shield className="text-[#22C55E]" size={16} />
            <span>Your password is encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}
