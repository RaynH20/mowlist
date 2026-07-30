import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { Loader2, Clock, CheckCircle, MapPin, Calendar, Scissors, AlertCircle, ArrowRight } from 'lucide-react'

interface PendingBooking {
  id: string
  booking_status: string
  estimated_price: number
  scheduled_date: string | null
  scheduled_time_window: string | null
  yard_size_category: string
  service_frequency: string
  provider_id: string | null
  payment_status: string
  address: {
    street_1: string
    city: string
    state: string
    zip_code: string
  } | null
  pro: {
    display_name: string | null
  } | null
}

const YARD_SIZE_LABELS: Record<string, string> = {
  small: 'Small Yard',
  standard: 'Medium Yard',
  medium: 'Medium Yard',
  large: 'Large Yard',
  custom_quote: 'Custom Quote',
}

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function BookingPendingPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  // ALL hooks at the top — before any early returns — to avoid React #310.
  const [booking, setBooking] = useState<PendingBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [justAccepted, setJustAccepted] = useState(false)
  const [pollTick, setPollTick] = useState(0)
  const prevStatusRef = useRef<string | null>(null)

  // Fetch the booking. Re-runs when pollTick changes (every 20s while pending).
  useEffect(() => {
    if (!bookingId || !user) return
    let cancelled = false
    const fetchBooking = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('bookings')
          .select(`
            id, booking_status, estimated_price, scheduled_date, scheduled_time_window,
            yard_size_category, service_frequency, provider_id, payment_status,
            address:addresses(street_1, city, state, zip_code),
            pro:provider_profiles(display_name)
          `)
          .eq('id', bookingId)
          .eq('customer_id', user.id)
          .maybeSingle()
        if (cancelled) return
        if (fetchErr) {
          setError(fetchErr.message)
          return
        }
        if (!data) {
          setError('Booking not found')
          return
        }
        // Trigger success animation when status flips from 'requested' to 'provider_assigned'
        if (prevStatusRef.current === 'requested' && data.booking_status === 'provider_assigned') {
          setJustAccepted(true)
          setTimeout(() => setJustAccepted(false), 4000)
        }
        prevStatusRef.current = data.booking_status
        setBooking(data as unknown as PendingBooking)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load booking')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchBooking()
    return () => { cancelled = true }
  }, [bookingId, user, pollTick])

  // Poll every 20 seconds while the booking is still in 'requested' state.
  // Once it moves to 'provider_assigned' (or further), we stop polling.
  useEffect(() => {
    if (!booking) return
    if (booking.booking_status !== 'requested') return
    const interval = setInterval(() => setPollTick((k) => k + 1), 20000)
    return () => clearInterval(interval)
  }, [booking?.booking_status])

  // === Early returns AFTER all hooks ===
  if (loading) {
    return (
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#22C55E]" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Couldn't load booking</h2>
            <p className="text-slate-600 text-sm mb-6">{error}</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  // If booking is already paid (booked) or completed, redirect to confirmation
  if (booking.booking_status === 'booked' || booking.booking_status === 'completed') {
    return (
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-[#22C55E]" size={32} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Booking already confirmed</h2>
            <p className="text-slate-600 text-sm mb-6">This booking has already been paid for.</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isRequested = booking.booking_status === 'requested'
  const isProAccepted = booking.booking_status === 'provider_assigned'

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {isRequested ? 'Looking for a pro…' : 'Pro accepted!'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {isRequested
            ? 'Hang tight — we just submitted your request. A local pro will accept shortly.'
            : 'Your pro is ready. Pay now to lock in the schedule.'}
        </p>

        {/* Status card */}
        <div
          className={`rounded-2xl shadow-sm border p-5 mb-4 transition-all ${
            justAccepted
              ? 'bg-green-50 border-[#22C55E] ring-4 ring-green-100 scale-[1.02]'
              : isRequested
                ? 'bg-white border-slate-100'
                : 'bg-white border-[#22C55E]'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            {isRequested ? (
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="text-amber-600 animate-pulse" size={20} />
              </div>
            ) : (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-[#22C55E]" size={20} />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900 text-sm">
                {isRequested ? 'Awaiting pro acceptance' : 'Pro ready to go'}
              </p>
              <p className="text-xs text-slate-500">
                {isRequested
                  ? 'We\'re matching you with a vetted local pro'
                  : `${booking.pro?.display_name || 'Your pro'} accepted the job`}
              </p>
            </div>
          </div>

          {/* Booking summary */}
          <div className="border-t border-slate-100 pt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Service</span>
              <span className="font-medium text-slate-900">
                {YARD_SIZE_LABELS[booking.yard_size_category] || 'Lawn Service'}
                {booking.service_frequency && (
                  <span className="text-slate-500"> · {FREQUENCY_LABELS[booking.service_frequency]}</span>
                )}
              </span>
            </div>
            {booking.scheduled_date && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> When
                </span>
                <span className="font-medium text-slate-900">
                  {formatDate(booking.scheduled_date)}
                  {booking.scheduled_time_window && ` at ${booking.scheduled_time_window}`}
                </span>
              </div>
            )}
            {booking.address && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin size={12} /> Where
                </span>
                <span className="font-medium text-slate-900 text-right">
                  {booking.address.street_1}
                  <br />
                  <span className="text-xs text-slate-500">
                    {booking.address.city}, {booking.address.state} {booking.address.zip_code}
                  </span>
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-bold text-[#22C55E]">
                ${booking.estimated_price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action area */}
        {isRequested && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              <span>Checking for pro acceptance every 20 seconds…</span>
            </div>
            <Link
              to="/dashboard"
              className="inline-block mt-3 text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Leave this page — we'll keep watching
            </Link>
          </div>
        )}

        {isProAccepted && (
          <>
            <button
              onClick={() => navigate(`/checkout?booking_id=${booking.id}`)}
              className="w-full bg-[#22C55E] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
            >
              <Scissors size={20} />
              Pay now to confirm
              <ArrowRight size={18} />
            </button>
            <p className="text-xs text-slate-500 text-center mt-3">
              Payment is held until your pro finishes the job. You'll get a receipt by email.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
