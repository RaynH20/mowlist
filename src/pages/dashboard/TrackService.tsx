import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, MapPin, CheckCircle, Car, Calendar, Scissors, ArrowRight,
  Loader2, AlertCircle, Phone, MessageCircle, Camera, Package,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getCustomerBookings, getUserAddresses } from '../../lib/api'
import type { Booking, Address } from '../../lib/database.types'

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
  // Which booking the user is currently viewing the timeline for
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

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

  // Default the selected booking to the highest-priority one
  const activeBooking = useMemo(() => {
    if (sortedTrackable.length === 0) return null
    if (selectedBookingId) {
      const found = sortedTrackable.find((b) => b.id === selectedBookingId)
      if (found) return found
    }
    return sortedTrackable[0]
  }, [sortedTrackable, selectedBookingId])

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

  if (!activeBooking) {
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
    const bookingAddress = addresses.find((a) => a.id === booking.address_id)
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

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#22C55E]" />
            <h4 className="text-sm font-semibold text-slate-900">Service Progress</h4>
          </div>
          {renderTimeline(booking)}
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

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Track Service</h1>
        <p className="text-sm text-slate-500 mt-1">
          {sortedTrackable.length > 1
            ? `You have ${sortedTrackable.length} services in progress. Tap any to see its timeline.`
            : activeBooking.booking_status === 'completed'
              ? 'This service is done — thanks for using MowList!'
              : activeBooking.booking_status === 'booked'
                ? "We're matching you with a pro. We'll update this page as it moves along."
                : 'Live status of your service, updated as your pro moves through each step.'}
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
          const isSelected = booking.id === activeBooking.id
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
