import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Shield, Scissors, AlertCircle, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

export default function CustomerLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [correctLoginPath, setCorrectLoginPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  // Debug: log state changes so we can see what's happening
  useEffect(() => {
    console.log('[CustomerLogin] state changed. error:', error, 'path:', correctLoginPath, 'loading:', loading)
    if (error) {
      // Scroll to top so the toast is visible
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [error, correctLoginPath, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setCorrectLoginPath(null)
    setLoading(true)

    console.log('[CustomerLogin] calling signIn with role=customer')
    const { error, wrongRole, correctLoginPath: path } = await signIn(email, password, 'customer')
    console.log('[CustomerLogin] signIn returned:', { error: error?.message, wrongRole, path })

    if (error) {
      console.log('[CustomerLogin] setting error state:', error.message)
      setError(error.message)
      if (wrongRole) setCorrectLoginPath(path || null)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* ERROR TOAST — fixed at top of page so it can't be missed */}
        {error && (
          <div
            data-testid="login-error-toast"
            className="mb-6 p-5 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-3 shadow-lg ring-4 ring-red-100"
          >
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={26} />
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-red-900 mb-1">Can't sign you in here</p>
              <p className="text-sm text-red-700">{error}</p>
              {correctLoginPath && (
                <Link
                  to={correctLoginPath}
                  className="mt-3 inline-flex items-center gap-1.5 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Take me to the right login
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setError(null); setCorrectLoginPath(null) }}
              className="text-red-400 hover:text-red-600 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
          {/* Role Badge */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <Scissors size={14} />
              Customer Login
            </span>
          </div>

          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
              <div className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center">
                <Scissors className="text-white" size={20} />
              </div>
              <span className="text-[#22C55E]">Mow</span>
              <span className="text-[#1E40AF]">List</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to manage your lawn care</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded text-[#22C55E] focus:ring-[#22C55E]" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#22C55E] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22C55E] text-white py-3.5 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-600">
              Don't have an account?{' '}
              <Link to="/signup/customer" className="text-[#22C55E] font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Provider Link */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-center text-slate-600 text-sm">
              Are you a lawn care professional?{' '}
              <Link to="/login/pro" className="text-[#1E40AF] font-semibold hover:underline">
                Sign in as Provider
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Shield className="text-[#22C55E]" size={16} />
            <span>Secure, encrypted login</span>
          </div>
        </div>
      </div>
    </div>
  )
}
