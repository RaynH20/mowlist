import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Shield, Scissors, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email')
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
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
              <p className="text-slate-600 mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>
              <div className="p-4 bg-slate-50 rounded-lg mb-6">
                <p className="text-sm text-slate-600">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-[#22C55E] hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[#22C55E] hover:underline"
              >
                <ArrowLeft size={18} />
                Back to Sign In
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
            <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2">Reset Your Password</h1>
            <p className="text-slate-600">Enter your email and we'll send you reset instructions</p>
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
                  className="w-full pl-10 pr-4 py-3.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-colors"
                  required
                />
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
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-600">
              Remember your password?{' '}
              <Link to="/login" className="text-[#22C55E] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Shield className="text-[#22C55E]" size={16} />
            <span>Your data is secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
