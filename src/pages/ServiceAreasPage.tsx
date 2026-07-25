import { useState } from 'react'
import { MapPin, CheckCircle, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function ServiceAreasPage() {
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const areas = [
    'Austin, TX',
    'Denver, CO',
    'Phoenix, AZ',
    'Dallas, TX',
    'Houston, TX',
    'San Antonio, TX',
    'Los Angeles, CA',
    'San Diego, CA',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !city) return

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1000)
  }

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Service <span className="text-[#22C55E]">Areas</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We're currently available in select cities across Texas, Colorado, Arizona, and California.
          </p>
        </div>

        <div className="py-8">
          <div className="bg-slate-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Where We Currently Serve</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {areas.map((area, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                  <MapPin className="text-[#22C55E]" size={20} />
                  <span className="font-medium text-slate-900">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Request City CTA */}
        <div className="py-12">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
            {submitted ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the list!</h3>
                <p className="text-slate-600">
                  We'll email you at <span className="font-medium">{email}</span> as soon as we launch in {city}.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">We Haven't Reached Your City Yet</h3>
                  <p className="text-slate-600 max-w-xl mx-auto">
                    We're rapidly expanding to new areas. Join the waitlist to be the first to know when we launch in your neighborhood.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City Name</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g., Atlanta, GA"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#22C55E] text-white py-3 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Notify Me <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="py-8 text-center">
          <p className="text-slate-600">
            Want to partner with us?{' '}
            <a href="/for-pros" className="text-[#22C55E] font-medium hover:underline">
              Join as a Pro
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
