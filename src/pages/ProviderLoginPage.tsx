import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Shield, Briefcase, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

export default function ProviderLoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message || 'Invalid credentials')
      setLoading(false)
      return
    }

    // Check role - if not a provider, redirect them to the right place
    const { data: profile } = await import('../lib/supabase').then(m => m.supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .single()
    )

    if (profile?.role === 'customer') {
      setError('This account is a customer, not a provider. Please use the customer login.')
      setLoading(false)
      return
    }

    // Redirect to pro dashboard
    navigate('/pro')
  }

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
          {/* Role Badge */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              <Briefcase size={14} />
              Provider Login
            </span>
          </div>

          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold">
              <div className="w-10 h-10 bg-[#22C55E] rounded-lg flex items-center justify-center">
                <svg className="text-white" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="text-[#22C55E]">Mow</span>
              <span className="text-[#1E40AF]">List</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2">Lawn Pro Portal</h1>
            <p className="text-slate-600">Sign in to manage your jobs</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

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
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
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
                  className="w-full pl-10 pr-12 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
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
                <input type="checkbox" className="rounded text-[#2563EB] focus:ring-[#2563EB]" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#2563EB] hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] text-white py-3.5 rounded-lg font-semibold hover:bg-[#1D4ED8] transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-600">
              Don't have a provider account?{' '}
              <Link to="/signup/pro" className="text-[#2563EB] font-semibold hover:underline">
                Apply as Pro
              </Link>
            </p>
          </div>

          {/* Customer Link */}
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-center text-slate-600 text-sm">
              Looking for lawn care?{' '}
              <Link to="/login/customer" className="text-[#22C55E] font-semibold hover:underline">
                Sign in as Customer
              </Link>
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="text-[#22C55E]" size={16} />
              <span>Guaranteed payments</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="text-[#22C55E]" size={16} />
              <span>Instant job alerts</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="text-[#22C55E]" size={16} />
              <span>Professional tools included</span>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Shield className="text-[#2563EB]" size={16} />
            <span>Secure provider portal</span>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Looking for customer login?{' '}
          <Link to="/login/customer" className="text-[#22C55E] font-medium hover:underline">
            Sign in as customer
          </Link>
        </p>
      </div>
    </div>
  )
}
