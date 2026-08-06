import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, CheckCircle, Sparkles, Rocket, ArrowRight, Search,
  Mail, Bell, Users, Briefcase, TrendingUp, Megaphone, Download, Share2
} from 'lucide-react'
import {
  ALL_STATES, ACTIVE_CITIES, UPCOMING_METROS, lookupZip,
  type ServiceStatus,
} from '../lib/serviceAreas'

type LookupResult = ReturnType<typeof lookupZip> | null

const STATUS_BADGE: Record<ServiceStatus, { label: string; bg: string; text: string; dot: string }> = {
  live: {
    label: 'Live now',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-800',
    dot: 'bg-[#22C55E]',
  },
  launching: {
    label: 'Launching now',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  coming_soon: {
    label: 'Coming soon',
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
  },
}

export default function ServiceAreasPage() {
  const [zip, setZip] = useState('')
  const [result, setResult] = useState<LookupResult>(null)
  const [notified, setNotified] = useState<{ zip: string; state: string } | null>(null)
  const [filter, setFilter] = useState<'all' | ServiceStatus>('all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (zip.trim().length >= 3) {
      setResult(lookupZip(zip))
      setNotified(null)
    }
  }

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault()
    if (result && zip) {
      setNotified({ zip, state: result.stateName || result.stateCode })
    }
  }

  // Quick stats
  const liveCount = ACTIVE_CITIES.filter(c => c.status === 'live').length
  const launchingCount = ACTIVE_CITIES.filter(c => c.status === 'launching').length
  const totalStatesActive = new Set(ACTIVE_CITIES.map(c => c.stateCode)).size

  // Filter states for the grid
  const filteredStates = useMemo(() => {
    if (filter === 'all') return ALL_STATES
    return ALL_STATES.filter(s => s.status === filter)
  }, [filter])

  return (
    <div className="bg-white">
      {/* ================================================================
          HERO — nationwide positioning + zip lookup
          ================================================================ */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-[#1E40AF] text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22C55E]/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={14} className="text-[#22C55E]" />
              Launching city by city across America
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              MowList is <span className="text-[#22C55E]">nationwide.</span>
              <br />
              Find a pro in your area.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
              We're a national platform for booking local lawn care. Enter your ZIP code to see if we're in your area — or to be the first pro in your city.
            </p>
          </div>

          {/* ZIP lookup */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Enter your ZIP code"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#22C55E] focus:outline-none text-lg"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              <button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Search size={18} />
                Check my area
              </button>
            </div>
          </form>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-10">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#22C55E]">{liveCount}</div>
              <div className="text-xs md:text-sm text-slate-300 mt-1">Cities live</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400">{launchingCount}</div>
              <div className="text-xs md:text-sm text-slate-300 mt-1">Launching now</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white">{totalStatesActive}</div>
              <div className="text-xs md:text-sm text-slate-300 mt-1">States active</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          ZIP RESULT PANEL — conditional, animated in
          ================================================================ */}
      {result && (
        <section className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {notified ? (
              // Notification confirmation
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-[#22C55E] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">You're on the list!</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  We'll email you as soon as MowList launches in <strong>{notified.state}</strong>. While you wait, every pro in this area gets $50 off their first month —{' '}
                  <Link to="/for-pros" className="text-[#22C55E] font-medium hover:underline">
                    become a pro
                  </Link>
                  .
                </p>
              </div>
            ) : result.status === 'live' ? (
              // LIVE result
              <div className="bg-white border-2 border-[#22C55E] rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#22C55E] rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                      Great news — MowList is live in {result.city}, {result.stateCode}!
                    </h3>
                    <p className="text-slate-600 mb-5">
                      Vetted local pros are accepting jobs in your area right now. Book a one-time mow or set up weekly service.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to={`/book?zip=${zip}`}
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        Book your first mow
                        <ArrowRight size={18} />
                      </Link>
                      <Link
                        to="/pricing"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-5 py-3 rounded-xl transition-all flex items-center justify-center"
                      >
                        See pricing
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : result.status === 'launching' ? (
              // LAUNCHING result
              <div className="bg-white border-2 border-amber-400 rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Rocket className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                      We're launching in {result.city ? `${result.city}, ` : ''}{result.stateName}!
                    </h3>
                    <p className="text-slate-600 mb-5">
                      Local promotion is underway. Be the first pro in your area, or get notified when customers can start booking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/for-pros"
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Briefcase size={18} />
                        Be the first pro
                      </Link>
                      <button
                        onClick={handleNotify}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Bell size={18} />
                        Notify me
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // COMING SOON result
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-white" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                      {result.stateName
                        ? `MowList isn't in ${result.stateName} yet — but it's on the way.`
                        : `MowList isn't in your area yet — but it's on the way.`}
                    </h3>
                    <p className="text-slate-600 mb-5">
                      We're expanding city by city. The fastest way to bring MowList to your area? Be the first pro.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/for-pros"
                        className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Briefcase size={18} />
                        Become a pro
                      </Link>
                      <button
                        onClick={handleNotify}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Bell size={18} />
                        Notify me when we launch
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ================================================================
          CURRENT COVERAGE — Live + Launching
          ================================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Where we are today</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Current coverage
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We're live in Texas and actively launching in Northeast Pennsylvania. New cities open every month.
            </p>
          </div>

          {/* Live now */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-[#22C55E] animate-pulse" />
              <h3 className="text-xl font-bold text-slate-900">Live now</h3>
              <span className="text-sm text-slate-500">— pros accepting jobs today</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ACTIVE_CITIES.filter(c => c.status === 'live').map((c, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={14} className="text-[#22C55E]" />
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Live</span>
                  </div>
                  <div className="font-bold text-slate-900">{c.city}</div>
                  <div className="text-xs text-slate-500">{c.stateCode}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Launching now */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-xl font-bold text-slate-900">Launching now</h3>
              <span className="text-sm text-slate-500">— actively recruiting first pros</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {ACTIVE_CITIES.filter(c => c.status === 'launching').map((c, i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Rocket size={14} className="text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Launching</span>
                  </div>
                  <div className="font-bold text-slate-900">{c.city}</div>
                  <div className="text-xs text-slate-500">{c.stateCode}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          COMING SOON — major metros organized by region
          ================================================================ */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Coming soon</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Expanding to a city near you
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              These markets are on our public roadmap. Want one to launch first? Become a pro there.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {UPCOMING_METROS.map((region, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                  {region.region}
                </h3>
                <ul className="space-y-2">
                  {region.cities.map((city, j) => (
                    <li key={j} className="flex items-center gap-2 text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span>{city.city}, {city.stateCode}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          ALL 50 STATES — grid with status
          ================================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">All 50 states</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              MowList is on the way everywhere
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Filter by status, or search your state below.
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { key: 'all', label: 'All states' },
              { key: 'live', label: 'Live now' },
              { key: 'launching', label: 'Launching' },
              { key: 'coming_soon', label: 'Coming soon' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key as 'all' | ServiceStatus)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === opt.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* States grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredStates.map(s => {
              const badge = STATUS_BADGE[s.status]
              return (
                <div
                  key={s.code}
                  className={`rounded-xl p-4 border ${badge.bg} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl font-bold text-slate-900">{s.code}</span>
                    <div className={`w-2 h-2 rounded-full ${badge.dot} mt-2`} />
                  </div>
                  <div className="text-sm font-medium text-slate-900 mb-1">{s.name}</div>
                  <div className={`text-xs font-medium ${badge.text}`}>
                    {s.cityCount > 0 ? `${s.cityCount} ${s.cityCount === 1 ? 'city' : 'cities'} ${s.status === 'live' ? 'live' : 'launching'}` : badge.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          PROMOTE LOCALLY — resources for the user (and future ambassadors)
          ================================================================ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">For local promoters</p>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Promote MowList in your area
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Want to be the face of MowList in your city? Help us launch, recruit your first pros, and earn ongoing bonuses for every pro and customer you bring on.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  { icon: Megaphone, text: 'Get a custom referral link to share with neighbors and friends' },
                  { icon: Users, text: 'Recruit your first 3 pros — we\'ll waive their setup fees' },
                  { icon: TrendingUp, text: 'Earn 10% of platform fees from your city for the first year' },
                  { icon: Share2, text: 'Co-branded flyers, business cards, and social posts' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#22C55E]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="text-[#22C55E]" size={18} />
                    </div>
                    <span className="text-slate-700 pt-1.5">{item.text}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-xl transition-all"
              >
                <Mail size={18} />
                Apply to be a local promoter
                <ArrowRight size={18} />
              </Link>
            </div>
            <div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Promotion starter kit</div>
                <div className="space-y-3">
                  {[
                    { name: 'Local flyer template', size: 'PDF · 2 pages' },
                    { name: 'Door hanger template', size: 'PDF · ready to print' },
                    { name: 'Social media graphics', size: 'PNG · 6 designs' },
                    { name: 'Email template for pros', size: 'DOCX · editable' },
                    { name: 'Talking points for home shows', size: 'PDF · 1 page' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-medium text-slate-900 text-sm">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.size}</div>
                      </div>
                      <Download size={16} className="text-slate-400" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Sign in to your promoter account to download
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA — become a pro
          ================================================================ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[#1E40AF] to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22C55E]/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Briefcase className="text-[#22C55E] mx-auto mb-6" size={48} />
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Don't see your city?
            <br />
            <span className="text-[#22C55E]">Be the first pro.</span>
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            The fastest way to bring MowList to your area is to be the pro who shows up first. Apply in 5 minutes, start earning within days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/for-pros"
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg"
            >
              Apply to be a pro
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/contact"
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center text-lg"
            >
              Talk to our team
            </Link>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            Setup fees waived for the first 3 pros in each new city.
          </p>
        </div>
      </section>
    </div>
  )
}
