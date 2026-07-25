import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, Check, X, Briefcase, CheckCircle } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import type { UserRole } from '../lib/database.types'

export default function ProviderSignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signUp } = useAuth()

  // Password validation rules
  const passwordValidation = useMemo(() => {
    return {
      length: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }
  }, [password])

  const isPasswordValid = useMemo(() => {
    const requirementsMet =
      [passwordValidation.hasLower, passwordValidation.hasUpper, passwordValidation.hasNumber, passwordValidation.hasSpecial]
      .filter(Boolean).length >= 3
    return passwordValidation.length && requirementsMet
  }, [passwordValidation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      setError('Please choose a stronger password. It must be at least 8 characters and include a mix of letters, numbers, and symbols.')
      return
    }

    setLoading(true)

    const role: UserRole = 'provider'
    const { error } = await signUp(email, password, role)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/pro')
    }
  }

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* Role Badge */}
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              <Briefcase size={14} />
              Provider Sign Up
            </span>
          </div>

          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-[#22C55E]">Mow</span>
              <span className="text-[#1E40AF]">List</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2">Become a Lawn Pro</h1>
            <p className="text-slate-600">Start earning by providing lawn care services</p>
          </div>

          {/* Benefits */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="text-[#22C55E]" size={16} />
              <span>Guaranteed payments</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="text-[#22C55E]" size={16} />
              <span>Instant job alerts</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="text-[#22C55E]" size={16} />
              <span>Professional tools included</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
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
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent ${
                    password && !isPasswordValid ? 'border-red-300 bg-red-50' : 'border-slate-300'
                  }`}
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

              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded ${password.length >= 8 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordValidation.hasLower && passwordValidation.hasUpper ? '' : 'bgbg-blue-500-slate-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordValidation.hasNumber ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordValidation.hasSpecial ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  </div>
                  <div className="space-y-1">
                    <div className={`text-xs flex items-center gap-1 ${passwordValidation.length ? 'text-blue-600' : 'text-slate-500'}`}>
                      {passwordValidation.length ? <Check size={12} className="text-blue-500" /> : <X size={12} />}
                      At least 8 characters
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${passwordValidation.hasLower && passwordValidation.hasUpper ? 'text-blue-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasLower && passwordValidation.hasUpper ? <Check size={12} className="text-blue-500" /> : <X size={12} />}
                      Mix of uppercase & lowercase
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-blue-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasNumber ? <Check size={12} className="text-blue-500" /> : <X size={12} />}
                      At least one number
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${passwordValidation.hasSpecial ? 'text-blue-600' : 'text-slate-500'}`}>
                      {passwordValidation.hasSpecial ? <Check size={12} className="text-blue-500" /> : <X size={12} />}
                      At least one symbol (!@#$%^&*)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2">
              <input type="checkbox" className="rounded text-[#2563EB] mt-1" required />
              <span className="text-sm text-slate-600">
                I agree to the{' '}
                <Link to="/terms" className="text-[#2563EB] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-[#2563EB] hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || (password.length > 0 && !isPasswordValid)}
              className="w-full bg-[#2563EB] text-white py-3 rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Apply as Provider'
              )}
            </button>
          </form>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-center text-slate-600 text-sm">
              Already have an account?{' '}
              <Link to="/login/pro" className="text-[#2563EB] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <p className="mt-4 text-center text-slate-600 text-sm">
            Looking for lawn care?{' '}
            <Link to="/signup/customer" className="text-[#22C55E] font-semibold hover:underline">
              Sign up as Customer
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
