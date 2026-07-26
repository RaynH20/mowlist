import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pause, X, Loader2, AlertCircle, Calendar, Scissors, RefreshCw } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings, updateBookingStatus } from '../../lib/api'
import type { Booking } from '../../lib/database.types'

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

// Use Record lookups instead of string comparisons to avoid TypeScript's strict
// literal-type comparison warnings (TS2367) on union types.
const RECURRING_FREQUENCIES: Record<string, boolean> = {
  weekly: true,
  biweekly: true,
  monthly: true,
}

const TERMINAL_STATUSES: Record<string, boolean> = {
  cancelled: true,
  refunded: true,
  completed: true,
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatPrice(amount: number | null): string {
  if (amount == null) return 'TBD'
  return `$${amount.toFixed(0)}`
}

function isRecurring(b: Booking): boolean {
  return !!RECURRING_FREQUENCIES[b.service_frequency]
}

function isActive(b: Booking): boolean {
  return !TERMINAL_STATUSES[b.booking_status]
}

function isUpcoming(b: Booking): boolean {
  if (!b.scheduled_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(b.scheduled_date + 'T00:00:00') >= today
}

export default function MyServices() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: e } = await getCustomerBookings(user.id)
        if (cancelled) return
        if (e) setError(e.message)
        else setBookings(data || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load services')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [user])

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this service? This cannot be undone.')) return
    setUpdating(bookingId)
    try {
      await updateBookingStatus(bookingId, 'cancelled')
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, booking_status: 'cancelled' as const } : b))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#22C55E]" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    )
  }

  const activeServices = bookings.filter((b) => isActive(b) && isUpcoming(b))
  const pastServices = bookings.filter((b) => !isActive(b) || !isUpcoming(b))

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Services</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="text-slate-400" size={32} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No services yet</h2>
          <p className="text-slate-600 mb-6">Book your first lawn care service to get started.</p>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
          >
            <Scissors size={18} />
            Book a Service
          </Link>
        </div>
      ) : (
        <>
          {activeServices.length > 0 && (
            <div className="space-y-4 mb-8">
              {activeServices.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Scissors size={16} className="text-[#22C55E] flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-slate-900">
                          {YARD_SIZE_LABELS[booking.yard_size_category] || 'Lawn Service'}
                        </h3>
                        {isRecurring(booking) && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                            <RefreshCw size={10} />
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm">
                        {FREQUENCY_LABELS[booking.service_frequency]} • {formatPrice(booking.estimated_price)}
                        {isRecurring(booking) && `/${booking.service_frequency.replace('ly', '').replace('bi', 'bi-')}`}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-slate-700 mt-2">
                        <Calendar size={14} />
                        <span>Next: {formatDate(booking.scheduled_date)}</span>
                        {booking.scheduled_time_window && (
                          <span className="text-slate-400">• {booking.scheduled_time_window}</span>
                        )}
                      </div>
                    </div>
                    <span className="bg-green-100 text-[#22C55E] px-3 py-1 rounded-full text-sm font-medium flex-shrink-0">
                      active
                    </span>
                  </div>
                  {isRecurring(booking) && (
                    <div className="mt-4 pt-4 border-t flex items-center gap-4">
                      <button
                        disabled={updating === booking.id}
                        className="flex items-center gap-2 text-slate-600 hover:text-[#22C55E] transition-colors disabled:opacity-50 text-sm"
                      >
                        <Pause size={18} />
                        <span>Skip This Week</span>
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={updating === booking.id}
                        className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors disabled:opacity-50 text-sm"
                      >
                        {updating === booking.id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {pastServices.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">History</h2>
              <div className="space-y-3">
                {pastServices.slice(0, 10).map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {YARD_SIZE_LABELS[booking.yard_size_category] || 'Lawn Service'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(booking.scheduled_date)} • {FREQUENCY_LABELS[booking.service_frequency]}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatPrice(booking.estimated_price)}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize">{booking.booking_status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
