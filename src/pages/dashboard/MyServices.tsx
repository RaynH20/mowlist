import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, Scissors, Zap, CheckCircle2, ChevronDown } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings } from '../../lib/api'
import type { Booking } from '../../lib/database.types'
import CustomerJobCard from '../../components/CustomerJobCard'

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
const TERMINAL_STATUSES: Record<string, boolean> = {
  cancelled: true,
  refunded: true,
  completed: true,
}
// Note: custom quotes have been removed — all bookings now use the standard
// booking flow with a fixed price from the yard-size selector.

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
  const [showPastServices, setShowPastServices] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const bookingsRes = await getCustomerBookings(user.id)
        if (cancelled) return
        if (bookingsRes.error) setError(bookingsRes.error.message)
        else setBookings(bookingsRes.data || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load services')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [user])

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
  const openQuotes: never[] = []
  const pastQuotes: never[] = []

  // NEEDS REVIEW: the pro marked the job done and the 24h clock is running.
  // These must never be buried — if the customer doesn't act, the payment
  // auto-releases. Pulled from the full list (not activeServices) because a job
  // finished yesterday isn't "upcoming" and would otherwise land in Past.
  const needsReview = bookings.filter((b) => b.booking_status === 'pending_review')
  const needsReviewIds = new Set(needsReview.map((b) => b.id))

  // ACTIVE NOW: jobs happening right now (the pro is on their way, on-site, or mowing)
  const ACTIVE_NOW_STATUSES = ['on_the_way', 'arrived', 'in_progress', 'mowing']
  const activeNow = activeServices.filter((b) => ACTIVE_NOW_STATUSES.includes(b.booking_status))

  // RECENTLY COMPLETED: finished in the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentlyCompleted = bookings.filter(
    (b) => b.booking_status === 'completed' &&
    b.completed_at && new Date(b.completed_at) >= sevenDaysAgo
  )

  // UPCOMING: future scheduled services (not active now, not awaiting review)
  const upcoming = activeServices.filter(
    (b) => !ACTIVE_NOW_STATUSES.includes(b.booking_status) && !needsReviewIds.has(b.id)
  )

  // PAST: cancelled, refunded, or completed > 7 days ago
  const olderCompleted = bookings.filter(
    (b) => b.booking_status === 'completed' &&
    (!b.completed_at || new Date(b.completed_at) < sevenDaysAgo)
  )
  const pastOnly = pastServices.filter(
    (b) => b.booking_status !== 'completed' && !needsReviewIds.has(b.id)
  )
  const allPast = [...pastOnly, ...olderCompleted]

  const isEmpty = bookings.length === 0

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
          {/* ============ 1. NEEDS YOUR REVIEW (24h clock is running) ============ */}
          {needsReview.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-white" size={16} />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Needs Your Review</h2>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                  {needsReview.length}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Approve to release payment, or dispute if something's wrong. Payment
                releases automatically 24 hours after the pro marks a job done.
              </p>
              <div className="space-y-3">
                {needsReview.map((booking) => (
                  <Link key={booking.id} to={`/dashboard/track?booking=${booking.id}`} className="block">
                    <CustomerJobCard
                      booking={booking}
                      address={(booking as any).address}
                      expanded={false}
                      onToggle={() => {}}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ============ 2. ACTIVE NOW (happening right now) ============ */}
          {activeNow.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative">
                  <div className="w-7 h-7 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <Zap className="text-white" size={16} />
                  </div>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full ring-2 ring-white animate-pulse" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Active Now</h2>
                <span className="text-xs bg-[#22C55E] text-white px-2 py-0.5 rounded-full font-medium">
                  {activeNow.length}
                </span>
              </div>
              <div className="space-y-3">
                {activeNow.map((booking) => (
                  <Link key={booking.id} to={`/dashboard/track?booking=${booking.id}`} className="block">
                    <CustomerJobCard
                      booking={booking}
                      address={(booking as any).address}
                      expanded={false}
                      onToggle={() => {}}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ============ 3. RECENTLY COMPLETED (last 7 days) ============ */}
          {recentlyCompleted.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-600" size={16} />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Recently Completed</h2>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                  {recentlyCompleted.length}
                </span>
              </div>
              <div className="space-y-3">
                {recentlyCompleted.map((booking) => (
                  <Link key={booking.id} to={`/dashboard/track?booking=${booking.id}`} className="block">
                    <CustomerJobCard
                      booking={booking}
                      address={(booking as any).address}
                      expanded={false}
                      onToggle={() => {}}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ============ 4. UPCOMING SERVICES (scheduled future) ============ */}
          {upcoming.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Scissors size={18} className="text-[#22C55E]" />
                <h2 className="text-lg font-semibold text-slate-900">Upcoming Services</h2>
                <span className="text-xs bg-green-100 text-[#22C55E] px-2 py-0.5 rounded-full font-medium">
                  {upcoming.length}
                </span>
              </div>
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <Link key={booking.id} to={`/dashboard/track?booking=${booking.id}`} className="block">
                    <CustomerJobCard
                      booking={booking}
                      address={(booking as any).address}
                      expanded={false}
                      onToggle={() => {}}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ============ 5. PAST SERVICES (cancelled, refunded, or completed > 7 days ago) ============ */}
          {allPast.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setShowPastServices(!showPastServices)}
                className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
              >
                <h2 className="text-lg font-semibold text-slate-900">Past Services</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {allPast.length}
                </span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${showPastServices ? 'rotate-180' : ''}`} />
              </button>
              {showPastServices && (
                <div className="space-y-3">
                  {allPast.slice(0, 10).map((booking) => (
                    <Link key={booking.id} to={`/dashboard/track?booking=${booking.id}`} className="block">
                      <CustomerJobCard
                        booking={booking}
                        address={(booking as any).address}
                        expanded={false}
                        onToggle={() => {}}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
