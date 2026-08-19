import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, Calendar, Scissors, ArrowRight } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings, getUserAddresses } from '../../lib/api'
import type { Booking, Address } from '../../lib/database.types'
import CustomerJobCard from '../../components/CustomerJobCard'

// Statuses where the service is "live" — i.e. worth tracking.
const ACTIVE_STATUSES: Record<string, boolean> = {
  provider_assigned: true,
  on_the_way: true,
  arrived: true,
  in_progress: true,
  pending_review: true, // Customer must approve or dispute — keep visible
  disputed: true,       // Customer is waiting for the pro to re-fix — keep visible
}

// Statuses that should never appear on the Track Service page.
const HIDDEN_STATUSES: Record<string, boolean> = {
  cancelled: true,
}

/**
 * Track Service focuses on LIVE tracking — jobs that are booked, in progress,
 * or awaiting the customer's review. Completed and past jobs live on My
 * Services instead, which keeps the two pages distinct:
 *   - Track Service = what's happening now + what's coming up
 *   - My Services   = your full booking history
 */
function isActiveForTracking(b: Booking): boolean {
  if (HIDDEN_STATUSES[b.booking_status]) return false
  if (b.booking_status === 'booked') return true
  if (ACTIVE_STATUSES[b.booking_status]) return true
  return false
}

export default function TrackService() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Bookings the customer just approved/disputed on this page. Approving moves
  // a booking to `completed`, which normally drops it off this page — that made
  // the card silently vanish and looked like nothing had happened. Keeping it
  // pinned for the rest of the visit lets the customer see the result (and
  // leave a review) before it moves to My Services.
  const [justActed, setJustActed] = useState<string[]>([])

  // Read ?booking=ID from the URL to auto-open a specific booking
  const [searchParams] = useSearchParams()
  const urlBookingId = searchParams.get('booking')
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(urlBookingId)

  // Keep selectedBookingId in sync with the URL when the user navigates here
  // from a "Track it" link. Without this, useState's initial value wins and
  // the URL is ignored on subsequent visits.
  useEffect(() => {
    if (urlBookingId && urlBookingId !== selectedBookingId) {
      setSelectedBookingId(urlBookingId)
      setTimeout(() => {
        const el = document.getElementById(`track-card-${urlBookingId}`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlBookingId])

  // Re-fetch the customer's bookings + addresses.
  const fetchBookings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [{ data: bookingsData, error: bookingsError }, { data: addressesData }] =
        await Promise.all([getCustomerBookings(user.id), getUserAddresses(user.id)])
      if (bookingsError) setError(bookingsError.message)
      else setBookings(bookingsData || [])
      setAddresses(addressesData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchBookings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  /**
   * Apply a status change to local state after a *confirmed* server write.
   * `customerApproveBooking` / `customerDisputeBooking` now select the updated
   * row back and throw if the UPDATE matched zero rows, so by the time we get
   * here the database really has changed — no re-fetch needed, and no risk of
   * a read replica handing back the old row and undoing this.
   */
  const applyLocalStatus = useCallback(
    (bookingId: string, patch: Partial<Booking> & Record<string, any>) => {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, ...patch } : b))
      )
      setJustActed((prev) => (prev.includes(bookingId) ? prev : [...prev, bookingId]))
    },
    []
  )

  const markBookingCompleted = useCallback(
    (bookingId: string) => {
      const now = new Date().toISOString()
      applyLocalStatus(bookingId, {
        booking_status: 'completed',
        customer_approved_at: now,
        reviewed_at: now,
        completed_at: now,
      } as any)
    },
    [applyLocalStatus]
  )

  const markBookingDisputed = useCallback(
    (bookingId: string) => {
      const now = new Date().toISOString()
      applyLocalStatus(bookingId, {
        booking_status: 'disputed',
        reviewed_at: now,
        disputed_at: now,
      } as any)
    },
    [applyLocalStatus]
  )

  const trackableBookings = useMemo(
    () => bookings.filter((b) => isActiveForTracking(b) || justActed.includes(b.id)),
    [bookings, justActed]
  )

  // Sort: in-progress first, then booked (by scheduled date asc), then completed
  const sortedTrackable = useMemo(() => {
    const score = (b: Booking): number => {
      if (b.booking_status === 'completed') return 3
      if (b.booking_status === 'booked') return 1
      return 0 // in-progress states
    }
    return [...trackableBookings].sort((a, b) => {
      const scoreDiff = score(a) - score(b)
      if (scoreDiff !== 0) return scoreDiff
      const ad = a.scheduled_date || '9999-12-31'
      const bd = b.scheduled_date || '9999-12-31'
      return ad.localeCompare(bd)
    })
  }, [trackableBookings])

  // The currently-expanded booking, or null = nothing is expanded.
  const explicitlyExpanded = selectedBookingId
    ? sortedTrackable.find((b) => b.id === selectedBookingId) || null
    : null

  // With exactly one trackable booking, auto-expand it (nothing to scroll
  // through anyway). Multi-booking stays all-collapsed until the user picks one.
  const expandedBooking =
    explicitlyExpanded ?? (sortedTrackable.length === 1 ? sortedTrackable[0] : null)

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

  if (sortedTrackable.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Track Service</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-slate-400" size={32} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No bookings to track</h2>
          <p className="text-slate-600 mb-6">
            Once you book a service, you'll see its progress here — from "Booked" all the way
            through to "Completed."
          </p>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
          >
            <Scissors size={18} />
            Book a Service
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Track Service</h1>
        <p className="text-sm text-slate-500 mt-1">
          {sortedTrackable.length > 1
            ? `You have ${sortedTrackable.length} active services. Tap any to see its timeline.`
            : "You've got 1 active service — tap to see its timeline."}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Scissors size={18} className="text-[#22C55E]" />
        <h2 className="text-lg font-semibold text-slate-900">Your Services</h2>
        <span className="text-xs bg-green-100 text-[#22C55E] px-2 py-0.5 rounded-full font-medium">
          {sortedTrackable.length}
        </span>
      </div>

      {/* Expandable booking cards — each shows the full timeline, photos and
          approve/dispute controls inline. CustomerJobCard is the single source
          of truth for how a customer's booking looks. */}
      <div className="space-y-2">
        {sortedTrackable.map((booking) => {
          const isSelected = expandedBooking?.id === booking.id
          const bookingAddress = addresses.find((a) => a.id === booking.address_id)
          return (
            <div key={booking.id} id={`track-card-${booking.id}`}>
              <CustomerJobCard
                booking={booking}
                address={bookingAddress ?? null}
                expanded={isSelected}
                onToggle={() => setSelectedBookingId(isSelected ? null : booking.id)}
                onAction={fetchBookings}
                onApproved={() => markBookingCompleted(booking.id)}
                onDisputed={() => markBookingDisputed(booking.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
