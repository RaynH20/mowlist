import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, CheckCircle, ArrowRight, Scissors, Sparkles,
  Loader2, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings } from '../../lib/api'
import type { Booking } from '../../lib/database.types'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchBookings = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: fetchError } = await getCustomerBookings(user.id)
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setBookings(data || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load bookings')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchBookings()
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
  const stats = {
    upcoming: upcomingBookings.length,
    thisMonth: thisMonthBookings.length,
    totalJobs: bookings.length,
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-4">My Dashboard</h1>

      {/* Stats — only when there are bookings */}
      {hasBookings && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{stats.upcoming}</div>
            <div className="text-xs text-slate-500">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">${totalSpent.toFixed(0)}</div>
            <div className="text-xs text-slate-500">Total Spent</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{stats.totalJobs}</div>
            <div className="text-xs text-slate-500">Total Jobs</div>
          </div>
        </div>
      )}

      {/* Welcome card for new users */}
      {!hasBookings && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-[#22C55E]" size={32} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Welcome to MowList!</h2>
            <p className="text-slate-600 text-sm mb-4">
              No services scheduled yet. Book your first lawn care visit to get started.
            </p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
            >
              <Scissors size={18} />
              Book Your First Service
            </Link>
          </div>
        </div>
      )}

      {/* Upcoming visits list */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            {hasBookings ? 'Upcoming Visits' : 'Upcoming'}
          </h2>
          {hasBookings && (
            <Link to="/dashboard/services" className="text-[#22C55E] font-medium text-sm flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {!hasBookings ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="text-slate-400" size={24} />
            </div>
            <p className="text-slate-500 text-sm">No upcoming visits</p>
            <Link to="/book" className="text-[#22C55E] text-sm font-medium mt-2 inline-block hover:underline">
              Schedule your first service
            </Link>
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-slate-400" size={24} />
            </div>
            <p className="text-slate-500 text-sm">No upcoming visits — all caught up!</p>
            <Link to="/book" className="text-[#22C55E] text-sm font-medium mt-2 inline-block hover:underline">
              Book another service
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-slate-200 rounded-lg p-3 hover:border-[#22C55E] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Scissors size={14} className="text-[#22C55E] flex-shrink-0" />
                      <span className="font-medium text-slate-900 text-sm">
                        {YARD_SIZE_LABELS[booking.yard_size_category] || 'Lawn Service'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          STATUS_COLORS[booking.booking_status] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {STATUS_LABELS[booking.booking_status] || booking.booking_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Calendar size={12} />
                      <span>{formatDate(booking.scheduled_date)}</span>
                      {booking.scheduled_time_window && (
                        <>
                          <span className="text-slate-300">•</span>
                          <Clock size={12} />
                          <span>{booking.scheduled_time_window}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin size={12} />
                      <span className="truncate">Service address</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-slate-900">${booking.estimated_price}</div>
                    <div className="text-xs text-slate-500">
                      {FREQUENCY_LABELS[booking.service_frequency] || booking.service_frequency}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions - Always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
        <Link to="/book" className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-medium text-slate-900 text-sm mb-1">Book Service</h3>
          <p className="text-slate-500 text-xs">Schedule lawn care</p>
        </Link>
        <Link to="/book" className="bg-[#22C55E] rounded-lg p-4 hover:bg-[#16A34A] transition-colors">
          <h3 className="font-medium text-white text-sm mb-1">Quick Book</h3>
          <p className="text-green-100 text-xs">Fast scheduling</p>
        </Link>
      </div>
    </div>
  )
}
