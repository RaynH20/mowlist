import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Clock, MapPin, CheckCircle, Car, Calendar, Scissors, ArrowRight,
  Loader2, AlertCircle, Phone, MessageCircle, Camera, Package,
  ChevronDown, ChevronUp, Timer, Shield, ThumbsUp, ThumbsDown, AlertTriangle,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings, getUserAddresses, getReviewForBooking, getEscrowStatus, customerApproveBooking, customerDisputeBooking, markBookingAsReviewed, type Review } from '../../lib/api'
import ReviewForm from '../../components/ReviewForm'
import FavoriteButton from '../../components/FavoriteButton'
import type { Booking, Address } from '../../lib/database.types'
import BookingStatusTracker from '../../components/BookingStatusTracker'
import ErrorBoundary from '../../components/ErrorBoundary'

const YARD_SIZE_LABELS: Record<string, string> = {
  small: 'Small Yard',
  standard: 'Medium Yard',
  large: 'Large Yard',
  custom_quote: 'Custom Quote',
}

// Statuses where the service is "in progress" — trackable live
const ACTIVE_STATUSES: Record<string, boolean> = {
  provider_assigned: true,
  on_the_way: true,
  arrived: true,
  in_progress: true,
}

// Statuses that should be hidden from the Track Service page
const HIDDEN_STATUSES: Record<string, boolean> = {
  cancelled: true,
}

const STATUS_LABELS: Record<string, string> = {
  booked: 'Booked',
  provider_assigned: 'Pro Assigned',
  on_the_way: 'On the Way',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  provider_assigned: <Package className="text-white" size={20} />,
  on_the_way: <Car className="text-white" size={20} />,
  arrived: <MapPin className="text-white" size={20} />,
  in_progress: <Scissors className="text-white" size={20} />,
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function isToday(iso: string | null): boolean {
  if (!iso) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(iso + 'T00:00:00')
  return d.getTime() === today.getTime()
}

function isActiveForTracking(b: Booking): boolean {
  // Show in the Track Service page if:
  // 1. Status is 'booked' (even if not today — user wants to see the timeline start)
  // 2. Status is one of the in-progress statuses
  // 3. Status is 'completed' (so user can review)
  // Hide cancelled bookings.
  if (HIDDEN_STATUSES[b.booking_status]) return false
  if (b.booking_status === 'booked') return true
  if (ACTIVE_STATUSES[b.booking_status]) return true
  if (b.booking_status === 'completed') return true
  return false
}

export default function TrackService() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Read ?booking=ID from URL to auto-open a specific booking
  const [searchParams] = useSearchParams()
  const urlBookingId = searchParams.get('booking')
  // Which booking the user is currently viewing the timeline for
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(urlBookingId)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const [{ data: bookingsData, error: bookingsError }, { data: addressesData }] = await Promise.all([
          getCustomerBookings(user.id),
          getUserAddresses(user.id),
        ])
        if (cancelled) return
        if (bookingsError) setError(bookingsError.message)
        else setBookings(bookingsData || [])
        setAddresses(addressesData || [])
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load service')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [user])

  // All bookings the user can track (booked / in-progress / completed).
  // useMemo must be declared BEFORE any early returns to keep hook order stable.
  const trackableBookings = useMemo(
    () => bookings.filter(isActiveForTracking),
    [bookings]
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
      // Within same bucket, earliest scheduled date first
      const ad = a.scheduled_date || '9999-12-31'
      const bd = b.scheduled_date || '9999-12-31'
      return ad.localeCompare(bd)
    })
  }, [trackableBookings])

  // The currently-expanded booking, or null = nothing is expanded.
  // No default — clicking the first card to "close" it actually closes it.
  const explicitlyExpanded = selectedBookingId
    ? sortedTrackable.find((b) => b.id === selectedBookingId) || null
    : null

  // If there's exactly one trackable booking, auto-expand it (nothing to
  // scroll through anyway). Multi-booking case stays all-collapsed until
  // the user picks one.
  const expandedBooking = explicitlyExpanded
    ?? (sortedTrackable.length === 1 ? sortedTrackable[0] : null)

  // Backwards-compat alias for the empty-state code path below
  const activeBooking = expandedBooking

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

  // All bookings the user can track (booked / in-progress / completed)
  // Note: the useMemo calls are above the early returns to keep hook order stable.
  const address = activeBooking
    ? addresses.find((a) => a.id === activeBooking.address_id)
    : null

  // Empty state: only show if there are NO trackable bookings at all.
  // (Previously checked !activeBooking which was the expanded booking, but
  // that meant all-collapsed multi-booking pages also hit the empty state.)
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
            Once you book a service, you'll see its progress here — from "Booked" all the way through to "Completed."
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

  // Build the timeline for a given booking (returns steps with done/current/pending status)
  const buildTimelineSteps = (status: string) => {
    const order = ['booked', 'provider_assigned', 'on_the_way', 'arrived', 'in_progress', 'completed']
    const labels: Record<string, { label: string; description: string }> = {
      booked: { label: 'Booked', description: 'Service scheduled' },
      provider_assigned: { label: 'Pro Assigned', description: 'Your pro accepted the job' },
      on_the_way: { label: 'On the Way', description: 'Heading to your location' },
      arrived: { label: 'Arrived', description: 'Pro is at your property' },
      in_progress: { label: 'In Progress', description: 'Service is being performed' },
      completed: { label: 'Completed', description: 'Service finished' },
    }
    const currentIdx = order.indexOf(status)
    return order.map((key, i) => {
      let stepStatus: 'done' | 'current' | 'pending' = 'pending'
      if (i < currentIdx) stepStatus = 'done'
      else if (i === currentIdx) stepStatus = 'current'
      return { key, label: labels[key].label, description: labels[key].description, status: stepStatus }
    })
  }

  // Render the timeline block for a single booking (used inside expanded cards)
  const renderTimeline = (booking: Booking) => {
    const steps = buildTimelineSteps(booking.booking_status)
    return (
      <div className="relative pl-2">
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200"></div>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-start gap-3 relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                  step.status === 'done'
                    ? 'bg-[#22C55E] text-white'
                    : step.status === 'current'
                      ? 'bg-[#22C55E] text-white ring-4 ring-green-100'
                      : 'bg-slate-200 text-slate-400'
                }`}
              >
                {step.status === 'done' ? <CheckCircle size={14} /> : index + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <span className={`text-sm font-medium block ${step.status !== 'pending' ? 'text-slate-900' : 'text-slate-400'}`}>
                  {step.label}
                  {step.status === 'current' && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </span>
                <p className={`text-xs ${step.status !== 'pending' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render the collapsed header for a booking card
  const renderCardHeader = (booking: Booking, isSelected: boolean) => {
    const isBooked = booking.booking_status === 'booked'
    const isCompleted = booking.booking_status === 'completed'
    return (
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-[#22C55E]' : 'bg-slate-100'
        }`}>
          <Scissors className={isSelected ? 'text-white' : 'text-slate-500'} size={16} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-slate-900 text-sm truncate">
            {YARD_SIZE_LABELS[booking.yard_size_category] || 'Lawn Service'}
          </p>
          <p className="text-xs text-slate-500">
            {booking.scheduled_date
              ? formatDate(booking.scheduled_date)
              : 'Date TBD'}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            isCompleted
              ? 'bg-slate-100 text-slate-700'
              : isBooked
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
          }`}
        >
          {STATUS_LABELS[booking.booking_status] || booking.booking_status}
        </span>
        {isSelected ? (
          <ChevronUp size={18} className="text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
        )}
      </div>
    )
  }

  // Render the expanded body for a booking card
  const renderCardBody = (booking: Booking) => {
    const isBooked = booking.booking_status === 'booked'
    const isCompleted = booking.booking_status === 'completed'
    const isPendingReview = booking.booking_status === 'pending_review'
    const bookingAddress = addresses.find((a) => a.id === booking.address_id)

    // Mark the booking as reviewed the first time the customer opens it
    if (isPendingReview && !(booking as any).reviewed_at) {
      markBookingAsReviewed(booking.id).catch(() => {})
    }

    return (
      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
        {/* Service details */}
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="text-[#22C55E] flex-shrink-0" size={14} />
            <span className="truncate">
              {bookingAddress
                ? `${bookingAddress.street_1}${bookingAddress.street_2 ? `, ${bookingAddress.street_2}` : ''}, ${bookingAddress.city}, ${bookingAddress.state} ${bookingAddress.zip_code}`
                : 'Service address'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="text-[#22C55E] flex-shrink-0" size={14} />
            <span>
              {formatDate(booking.scheduled_date)}
              {booking.scheduled_time_window && ` at ${booking.scheduled_time_window}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Scissors className="text-[#22C55E] flex-shrink-0" size={14} />
            <span>${booking.estimated_price}</span>
          </div>
        </div>

        {/* Status banner */}
        <div className={`rounded-lg p-3 flex items-center gap-3 ${
          isBooked ? 'bg-amber-50' : isCompleted ? 'bg-slate-50' : 'bg-blue-50'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isBooked ? 'bg-amber-500' : isCompleted ? 'bg-slate-500' : 'bg-blue-500'
          }`}>
            {isCompleted ? (
              <CheckCircle className="text-white" size={16} />
            ) : isBooked ? (
              <Clock className="text-white" size={16} />
            ) : (
              <Car className="text-white" size={16} />
            )}
          </div>
          <div>
            <p className={`text-xs font-medium ${
              isBooked ? 'text-amber-600' : isCompleted ? 'text-slate-600' : 'text-blue-600'
            }`}>
              {isBooked
                ? 'Waiting for a pro to accept'
                : isCompleted
                  ? 'Service complete'
                  : 'Live status'}
            </p>
            <p className={`text-sm font-semibold ${
              isBooked ? 'text-amber-700' : isCompleted ? 'text-slate-700' : 'text-blue-700'
            }`}>
              {STATUS_LABELS[booking.booking_status] || 'Scheduled'}
            </p>
          </div>
        </div>

        {/* 24h escrow review window — pro marked the job done, customer's turn */}
        {isPendingReview && (booking as any).provider_id && (
          <ReviewAndApproveSection booking={booking} proName={(booking as any).provider_name || 'your pro'} onAction={() => fetchBookings()} />
        )}

        {/* Rate your pro (only for completed bookings) */}
        {isCompleted && (booking as any).provider_id && (
          <RateYourProSection booking={booking} proName={(booking as any).provider_name || 'your pro'} />
        )}

        {/* Timeline - using the new status tracker with photo gallery + live tracking.
            Wrapped in ErrorBoundary so a broken map never crashes the page. */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#22C55E]" />
            <h4 className="text-sm font-semibold text-slate-900">Service Progress</h4>
          </div>
          <ErrorBoundary name={`Tracker-${booking.id}`}>
            <BookingStatusTracker
              status={booking.booking_status}
              scheduledDate={booking.scheduled_date}
              scheduledTimeWindow={booking.scheduled_time_window}
              beforePhotoUrl={booking.before_photo_url}
              afterPhotoUrl={booking.after_photo_url}
              hasActiveTracking={['on_the_way', 'arrived', 'in_progress'].includes(booking.booking_status)}
              bookingId={booking.id}
              address={bookingAddress}
              proLat={booking.pro_lat}
              proLng={booking.pro_lng}
              selectedAddons={(booking as any).selected_addons}
            />
          </ErrorBoundary>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            disabled={isBooked || isCompleted}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              isBooked ? 'bg-slate-200' : 'bg-blue-100'
            }`}>
              <MessageCircle className={isBooked ? 'text-slate-400' : 'text-blue-500'} size={14} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 text-xs">Message Pro</h3>
              <p className="text-slate-500 text-[10px]">
                {isBooked ? 'Available once matched' : 'Send a quick message'}
              </p>
            </div>
          </button>
          <button
            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            disabled={!isCompleted}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              isCompleted ? 'bg-green-100' : 'bg-slate-200'
            }`}>
              <Camera className={isCompleted ? 'text-green-500' : 'text-slate-400'} size={14} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 text-xs">Service Photos</h3>
              <p className="text-slate-500 text-[10px]">
                {isCompleted ? 'View before/after' : 'After the visit'}
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // Subtitle: when there are multiple bookings, prompt to tap one. When
  // there's exactly one, describe that one (using expandedBooking as a
  // hint, but not requiring it to be expanded).
  const singleBooking = sortedTrackable.length === 1 ? sortedTrackable[0] : null

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Track Service</h1>
        <p className="text-sm text-slate-500 mt-1">
          {sortedTrackable.length > 1
            ? `You have ${sortedTrackable.length} services in progress. Tap any to see its timeline.`
            : singleBooking?.booking_status === 'completed'
              ? 'This service is done — thanks for using MowList!'
              : singleBooking?.booking_status === 'booked'
                ? "We're matching you with a pro. We'll update this page as it moves along."
                : singleBooking
                  ? 'Live status of your service, updated as your pro moves through each step.'
                  : ''}
        </p>
      </div>

      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <Scissors size={18} className="text-[#22C55E]" />
        <h2 className="text-lg font-semibold text-slate-900">Your Services</h2>
        <span className="text-xs bg-green-100 text-[#22C55E] px-2 py-0.5 rounded-full font-medium">
          {sortedTrackable.length}
        </span>
      </div>

      {/* Expandable booking cards — each one shows the full timeline inline */}
      <div className="space-y-2">
        {sortedTrackable.map((booking) => {
          const isSelected = expandedBooking?.id === booking.id
          return (
            <div
              key={booking.id}
              className={`rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#22C55E] bg-green-50/30 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => setSelectedBookingId(isSelected ? null : booking.id)}
                className="w-full p-3 flex items-center text-left"
                aria-expanded={isSelected}
              >
                {renderCardHeader(booking, isSelected)}
              </button>
              {isSelected && renderCardBody(booking)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Shown only for completed bookings with an assigned pro.
 * - If customer hasn't reviewed: prompts them to rate
 * - If they have: shows their review with an "Edit" link
 * Also shows the Save to favorites button.
 */
function RateYourProSection({ booking, proName }: { booking: any; proName: string }) {
  const [showForm, setShowForm] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getReviewForBooking(booking.id).then((res) => {
      if (cancelled) return
      setReview(res.data)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [booking.id])

  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⭐</span>
        <h4 className="text-sm font-semibold text-slate-900">How was {proName}?</h4>
      </div>

      {!loaded ? (
        <div className="h-12 bg-slate-50 rounded-lg animate-pulse" />
      ) : review ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= review.rating ? 'text-amber-400' : 'text-slate-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-emerald-700 font-medium">Your review</span>
          </div>
          {review.comment && (
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{review.comment}</p>
          )}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-emerald-200">
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-emerald-700 font-medium hover:underline"
            >
              Edit
            </button>
            <FavoriteButton providerId={booking.provider_id} variant="compact" />
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-900 mb-2">
            Reviews help other customers find great pros. Takes 30 seconds.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 bg-[#22C55E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16A34A] transition-colors"
            >
              ★ Rate this pro
            </button>
            <FavoriteButton providerId={booking.provider_id} variant="compact" />
          </div>
        </div>
      )}

      {showForm && (
        <ReviewForm
          bookingId={booking.id}
          proName={proName}
          existingReview={review ? { rating: review.rating, comment: review.comment } : null}
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            // Refetch
            getReviewForBooking(booking.id).then((res) => setReview(res.data))
          }}
        />
      )}
    </div>
  )
}

/**
 * Shown when booking status is 'pending_review' — pro marked the job done
 * and it's now in the 24h escrow review window.
 *
 * Customer can:
 *   - See all the before/after photos for the base + each addon
 *   - Approve & release payment (immediately captures the held payment)
 *   - Dispute (pauses payment, sends to admin review)
 *   - Auto-release happens 24h after pro marked the job done
 */
function ReviewAndApproveSection({
  booking,
  proName,
  onAction,
}: {
  booking: any
  proName: string
  onAction: () => void
}) {
  const [approving, setApproving] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [escrow, setEscrow] = useState<any>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let cancelled = false
    getEscrowStatus(booking.id).then((res) => {
      if (!cancelled && res.data) setEscrow(res.data)
    })
    return () => { cancelled = true }
  }, [booking.id])

  // Tick every 30s for the countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const autoCaptureAt = escrow?.auto_capture_at ? new Date(escrow.auto_capture_at).getTime() : null
  const msRemaining = autoCaptureAt ? autoCaptureAt - now : 0
  const hoursRemaining = Math.max(0, msRemaining / 3_600_000)
  const minutesRemaining = Math.max(0, Math.floor((msRemaining % 3_600_000) / 60_000))
  const showCountdown = msRemaining > 0 && msRemaining < 24 * 60 * 60 * 1000

  const handleApprove = async () => {
    if (!confirm(`Approve the work and release payment to ${proName}? This cannot be undone.`)) return
    setApproving(true)
    setError(null)
    const { error: err } = await customerApproveBooking(booking.id)
    setApproving(false)
    if (err) {
      setError(err.message)
      return
    }
    onAction()
  }

  const handleDispute = async () => {
    if (disputeReason.trim().length < 10) {
      setError('Please describe what\'s wrong (at least 10 characters).')
      return
    }
    setDisputing(true)
    setError(null)
    const { error: err } = await customerDisputeBooking(booking.id, disputeReason)
    setDisputing(false)
    if (err) {
      setError(err.message)
      return
    }
    setShowDisputeForm(false)
    onAction()
  }

  return (
    <div className="space-y-3">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="text-white" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900">Ready for your review</p>
            <p className="text-sm text-amber-800 mt-0.5">
              {proName} marked the job as done. Your payment is held in escrow — review the photos, then approve or dispute.
            </p>
          </div>
        </div>
      </div>

      {/* 24h countdown */}
      {showCountdown && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-3">
          <Timer className="text-slate-500 flex-shrink-0" size={18} />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Auto-release in</p>
            <p className="text-xs text-slate-500">If you don't act, payment will be released automatically.</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {hoursRemaining >= 1
                ? `${Math.floor(hoursRemaining)}h ${minutesRemaining}m`
                : `${minutesRemaining}m`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action buttons: Approve / Dispute */}
      {!showDisputeForm ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleApprove}
            disabled={approving || disputing}
            className="flex items-center justify-center gap-2 bg-[#22C55E] text-white px-4 py-3 rounded-lg text-sm font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50"
          >
            {approving ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
            Approve & Release Payment
          </button>
          <button
            onClick={() => setShowDisputeForm(true)}
            disabled={approving || disputing}
            className="flex items-center justify-center gap-2 bg-white text-amber-700 border-2 border-amber-300 px-4 py-3 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <ThumbsDown size={16} />
            Dispute
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-amber-900 text-sm">Tell us what's wrong</p>
              <p className="text-xs text-amber-800 mt-0.5">
                MowList will hold the payment and review. Be specific so we can help.
              </p>
            </div>
          </div>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. The backyard wasn't mowed. Only the front was done."
            className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowDisputeForm(false); setError(null) }}
              className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDispute}
              disabled={disputing || disputeReason.trim().length < 10}
              className="flex-1 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {disputing ? <Loader2 size={14} className="animate-spin" /> : <ThumbsDown size={14} />}
              Submit Dispute
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
