import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pause, X, Loader2, AlertCircle, Calendar, Scissors, RefreshCw, FileText, Clock, ArrowRight, User } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings, getCustomerQuoteRequests, updateBookingStatus } from '../../lib/api'
import type { Booking, QuoteRequest } from '../../lib/database.types'

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

// Open quote statuses — anything not in here is "done" from the customer's POV
const OPEN_QUOTE_STATUSES: Record<string, boolean> = {
  submitted: true,
  under_review: true,
  quoted: true,
}

const QUOTE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  quoted: { label: 'Quote Ready', color: 'bg-green-100 text-green-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  declined: { label: 'Declined', color: 'bg-slate-100 text-slate-600' },
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
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
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
        const [bookingsRes, quotesRes] = await Promise.all([
          getCustomerBookings(user.id),
          getCustomerQuoteRequests(user.id),
        ])
        if (cancelled) return
        if (bookingsRes.error) setError(bookingsRes.error.message)
        else setBookings(bookingsRes.data || [])
        setQuoteRequests(quotesRes.data || [])
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
  const openQuotes = quoteRequests.filter((q) => OPEN_QUOTE_STATUSES[q.status])
  const pastQuotes = quoteRequests.filter((q) => !OPEN_QUOTE_STATUSES[q.status])

  // Bookings that need the customer's attention (still need to pay, or waiting
  // for a pro to accept). These float to the top so they aren't buried.
  const actionNeeded = activeServices.filter(
    (b) => b.booking_status === 'provider_assigned' || b.booking_status === 'requested'
  )
  const stableActiveServices = activeServices.filter(
    (b) => b.booking_status !== 'provider_assigned' && b.booking_status !== 'requested'
  )

  const isEmpty = bookings.length === 0 && quoteRequests.length === 0

  // Render a booking card. Returns the JSX so we can use it both in the
  // "Action Needed" section (top) and "Upcoming Services" (regular list).
  const renderBookingCard = (booking: any, showRecurringControls: boolean) => {
    const isActionNeeded =
      booking.booking_status === 'provider_assigned' || booking.booking_status === 'requested'
    return (
      <Link
        key={booking.id}
        to={`/dashboard/track?booking=${booking.id}`}
        className={`block rounded-xl shadow-sm p-6 transition-all hover:shadow-md hover:border-[#22C55E] cursor-pointer ${
          isActionNeeded ? 'bg-amber-50 border-2 border-amber-200' : 'bg-white'
        }`}
      >
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
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
            booking.booking_status === 'provider_assigned'
              ? 'bg-amber-100 text-amber-700'
              : booking.booking_status === 'requested'
                ? 'bg-slate-100 text-slate-700'
                : 'bg-green-100 text-[#22C55E]'
          }`}>
            {booking.booking_status === 'provider_assigned'
              ? 'Ready to Pay'
              : booking.booking_status === 'requested'
                ? 'Awaiting Pro'
                : 'active'}
          </span>
        </div>
        {isActionNeeded && (
          <div className="mt-4 pt-4 border-t border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-slate-700 font-medium">
              {booking.booking_status === 'requested'
                ? 'A pro will accept your request soon. We\'ll let you know.'
                : 'A pro has accepted! Pay now to confirm your booking.'}
            </p>
            <Link
              to={`/booking-pending/${booking.id}`}
              className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors text-sm flex-shrink-0"
            >
              {booking.booking_status === 'requested' ? 'View status' : 'Pay now'}
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
        {showRecurringControls && isRecurring(booking) && !isActionNeeded && (
          <div className="mt-4 pt-4 border-t flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
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

        {/* Provider name at bottom */}
        {booking.provider_name && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
            <User size={12} />
            <span>Pro: <span className="font-medium text-slate-700">{booking.provider_name}</span></span>
          </div>
        )}

        {/* Click hint */}
        <div className="mt-2 flex items-center justify-end gap-1 text-xs text-[#22C55E] font-medium">
          View details
          <ArrowRight size={12} />
        </div>
      </Link>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Services</h1>

      {isEmpty ? (
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
          {/* Action needed (bookings awaiting customer action — top of page) */}
          {actionNeeded.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-amber-600" size={16} />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Action Needed</h2>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {actionNeeded.length}
                </span>
              </div>
              <div className="space-y-4">
                {actionNeeded.map((booking) => renderBookingCard(booking, false))}
              </div>
            </div>
          )}

          {/* Pending quote requests */}
          {openQuotes.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <FileText size={18} className="text-[#1E40AF]" />
                <h2 className="text-lg font-semibold text-slate-900">Pending Quotes</h2>
              </div>
              <div className="space-y-3">
                {openQuotes.map((quote) => {
                  const statusInfo = QUOTE_STATUS_LABELS[quote.status] || { label: quote.status, color: 'bg-slate-100 text-slate-600' }
                  const isQuoted = quote.status === 'quoted' && quote.quoted_price != null
                  return (
                    <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-blue-100 p-5">
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-slate-900">
                              {quote.property_type === 'other' && quote.property_type_other
                                ? quote.property_type_other
                                : quote.property_type.charAt(0).toUpperCase() + quote.property_type.slice(1)}
                              {' '}— Custom Quote
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-mono">
                            Quote #{quote.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        {isQuoted && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Quoted price</p>
                            <p className="text-2xl font-bold text-[#22C55E]">${quote.quoted_price!.toFixed(0)}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={12} />
                        <span>Submitted {formatDate(quote.created_at.split('T')[0])}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active services (bookings) — action-needed ones moved out above */}
          {stableActiveServices.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Scissors size={18} className="text-[#22C55E]" />
                <h2 className="text-lg font-semibold text-slate-900">Upcoming Services</h2>
                <span className="text-xs bg-green-100 text-[#22C55E] px-2 py-0.5 rounded-full font-medium">
                  {stableActiveServices.length}
                </span>
              </div>
              <div className="space-y-4">
                {stableActiveServices.map((booking) => renderBookingCard(booking, true))}
              </div>
            </div>
          )}

          {/* Past bookings */}
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

          {/* Past quote requests (declined/approved) */}
          {pastQuotes.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">Past Quotes</h2>
              <div className="space-y-3">
                {pastQuotes.slice(0, 10).map((quote) => {
                  const statusInfo = QUOTE_STATUS_LABELS[quote.status] || { label: quote.status, color: 'bg-slate-100 text-slate-600' }
                  return (
                    <div key={quote.id} className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {quote.property_type === 'other' && quote.property_type_other
                            ? quote.property_type_other
                            : quote.property_type.charAt(0).toUpperCase() + quote.property_type.slice(1)}{' '}
                          — Custom Quote
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          #{quote.id.slice(-8).toUpperCase()} • {formatDate(quote.created_at.split('T')[0])}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {quote.quoted_price != null && (
                          <p className="text-sm font-semibold text-slate-700 mt-1">${quote.quoted_price.toFixed(0)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
