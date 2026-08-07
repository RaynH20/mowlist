import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, CheckCircle, ArrowRight, Scissors, Sparkles,
  Loader2, AlertCircle, FileText, CreditCard, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings, getCustomerQuoteRequests } from '../../lib/api'
import type { Booking, QuoteRequest } from '../../lib/database.types'
import ProAvatar from '../../components/ProAvatar'

// Friendly labels for the enum values
const YARD_SIZE_LABELS: Record<string, string> = {
  small: 'Small Yard',
  standard: 'Medium Yard',
  large: 'Large Yard',
  custom_quote: 'Custom Quote',
}

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  booked: 'Awaiting Pro',
  provider_assigned: 'Pro Assigned',
  on_the_way: 'Pro On The Way',
  arrived: 'Pro Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  refunded: 'Refunded',
}

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-slate-100 text-slate-700',
  booked: 'bg-blue-100 text-blue-700',
  provider_assigned: 'bg-indigo-100 text-indigo-700',
  on_the_way: 'bg-amber-100 text-amber-700',
  arrived: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
  refunded: 'bg-slate-100 text-slate-700',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  const d = new Date(iso + 'T00:00:00') // local-date parse (no TZ shift)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function isUpcoming(booking: Booking): boolean {
  if (!booking.scheduled_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const scheduled = new Date(booking.scheduled_date + 'T00:00:00')
  // Upcoming = scheduled today or later AND not in a terminal state
  const terminalStates = ['completed', 'cancelled', 'refunded']
  return scheduled >= today && !terminalStates.includes(booking.booking_status)
}

function isThisMonth(booking: Booking): boolean {
  if (!booking.scheduled_date) return false
  const d = new Date(booking.scheduled_date + 'T00:00:00')
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export default function Dashboard() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // First name for personalized greeting. All hooks must be declared before
  // any early returns so React's hook order is stable.
  const [firstName, setFirstName] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const [bookingsRes, quotesRes] = await Promise.all([
          getCustomerBookings(user.id),
          getCustomerQuoteRequests(user.id),
        ])
        if (cancelled) return
        if (bookingsRes.error) setError(bookingsRes.error.message)
        else setBookings(bookingsRes.data || [])
        setQuoteRequests(quotesRes.data || [])
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [user])

  // Best-effort first name for the greeting
  useEffect(() => {
    if (!user) return
    let cancelled = false
    import('../../lib/supabase').then(({ supabase }) => {
      supabase
        .from('customer_profiles')
        .select('first_name')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data?.first_name) setFirstName(data.first_name)
        })
    })
    return () => { cancelled = true }
  }, [user])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#22C55E]" size={32} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-medium text-red-900 text-sm">Couldn't load your bookings</h3>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-red-700 text-sm font-medium mt-2 underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  const hasBookings = bookings.length > 0
  const upcomingBookings = bookings.filter(isUpcoming)
  const thisMonthBookings = bookings.filter(isThisMonth)
  const totalSpent = bookings.reduce((sum, b) => sum + (b.estimated_price || 0), 0)
  const completedBookings = bookings.filter((b) => b.booking_status === 'completed')
  const openQuotes = quoteRequests.filter((q) => ['submitted', 'under_review', 'quoted'].includes(q.status))
  const nextBooking = upcomingBookings.sort((a, b) => {
    if (!a.scheduled_date) return 1
    if (!b.scheduled_date) return -1
    return a.scheduled_date.localeCompare(b.scheduled_date)
  })[0]
  const isFirstTime = !hasBookings && openQuotes.length === 0

  return (
    <div>
      {/* Greeting */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">
          {firstName ? `Hi ${firstName} 👋` : 'Welcome back 👋'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {hasBookings
            ? `You have ${upcomingBookings.length} upcoming visit${upcomingBookings.length === 1 ? '' : 's'}.`
            : 'Ready to get your lawn taken care of?'}
        </p>
      </div>

      {/* Needs attention: open quote requests */}
      {openQuotes.length > 0 && (
        <Link
          to="/dashboard/services"
          className="block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4 hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FileText className="text-[#1E40AF]" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm">
                {openQuotes.length === 1 ? '1 quote pending review' : `${openQuotes.length} quotes pending review`}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {openQuotes[0].status === 'quoted' && openQuotes[0].quoted_price != null
                  ? `Quote ready: $${openQuotes[0].quoted_price.toFixed(0)} — tap to view`
                  : "We're reviewing your property and will be in touch"}
              </p>
            </div>
            <ArrowRight className="text-[#1E40AF] flex-shrink-0" size={18} />
          </div>
        </Link>
      )}

      {/* Stats grid */}
      {hasBookings && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={14} className="text-[#22C55E]" />
              <span className="text-xs text-slate-500">Upcoming</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{upcomingBookings.length}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle size={14} className="text-[#22C55E]" />
              <span className="text-xs text-slate-500">Completed</span>
            </div>
            <div className="text-xl font-bold text-slate-900">{completedBookings.length}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-[#22C55E]" />
              <span className="text-xs text-slate-500">Spent</span>
            </div>
            <div className="text-xl font-bold text-slate-900">${totalSpent.toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* First-time user welcome */}
      {isFirstTime && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-4 text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Sparkles className="text-[#22C55E]" size={28} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Welcome to MowList!</h2>
          <p className="text-slate-600 text-sm mb-4 max-w-sm mx-auto">
            Book your first lawn care visit and we'll match you with a vetted local pro.
          </p>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
          >
            <Scissors size={18} />
            Book Your First Service
          </Link>
        </div>
      )}

      {/* Next up — featured card for the next visit */}
      {nextBooking && (
        <div className="bg-gradient-to-br from-[#22C55E] to-emerald-600 rounded-xl p-5 mb-4 text-white shadow-lg shadow-green-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-green-100 font-medium">Next Visit</span>
            <span
              className="text-xs bg-white/20 backdrop-blur px-2 py-0.5 rounded-full font-medium"
            >
              {STATUS_LABELS[nextBooking.booking_status] || 'Scheduled'}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-2">
            {YARD_SIZE_LABELS[nextBooking.yard_size_category] || 'Lawn Service'}
          </h3>
          <div className="flex items-center gap-2 text-sm text-green-50 mb-1">
            <Calendar size={14} />
            <span>{formatDate(nextBooking.scheduled_date)}</span>
            {nextBooking.scheduled_time_window && (
              <>
                <span className="text-green-200">•</span>
                <Clock size={14} />
                <span>{nextBooking.scheduled_time_window}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-green-50 mb-3">
            <MapPin size={14} />
            <span>Service address</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">${nextBooking.estimated_price}</span>
            <Link
              to="/dashboard/track"
              className="inline-flex items-center gap-1 bg-white text-[#22C55E] px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              Track it
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Recent activity — last few bookings */}
      {hasBookings && upcomingBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Coming up</h2>
            <Link to="/dashboard/services" className="text-[#22C55E] font-medium text-sm flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <Link
                key={booking.id}
                to={`/dashboard/track?booking=${booking.id}`}
                className="block border border-slate-200 rounded-lg p-3 hover:border-[#22C55E] hover:bg-green-50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Scissors size={16} className="text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {YARD_SIZE_LABELS[booking.yard_size_category] || 'Lawn Service'}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(booking.scheduled_date)}</p>
                    {(booking as any).provider_name && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <ProAvatar
                          imageUrl={(booking as any).provider_image_url}
                          name={(booking as any).provider_name}
                          size="sm"
                        />
                        <p className="text-xs text-slate-500 truncate">
                          <span className="font-medium text-slate-700">{(booking as any).provider_name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-900">${booking.estimated_price}</p>
                    <p className="text-xs text-[#22C55E] font-medium">View →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions row */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <Link to="/book" className="bg-[#22C55E] rounded-lg p-3 hover:bg-[#16A34A] transition-colors flex items-center gap-2">
          <Scissors className="text-white" size={18} />
          <div>
            <div className="font-medium text-white text-sm">Book</div>
            <div className="text-green-100 text-xs">Schedule next mow</div>
          </div>
        </Link>
        <Link to="/dashboard/payment" className="bg-white border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors flex items-center gap-2">
          <CreditCard className="text-slate-700" size={18} />
          <div>
            <div className="font-medium text-slate-900 text-sm">Payment</div>
            <div className="text-slate-500 text-xs">Manage cards</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
