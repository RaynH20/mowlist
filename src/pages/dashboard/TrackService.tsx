import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, MapPin, CheckCircle, Car, Calendar, Scissors, ArrowRight,
  Loader2, AlertCircle, Phone, MessageCircle, Camera, Package,
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

  const activeBooking = bookings.find(isActiveForTracking)
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

  // Build the timeline based on current status
  const timelineSteps: Array<{ key: string; label: string; description: string; status: 'done' | 'current' | 'pending' }> = [
    { key: 'booked', label: 'Booked', description: 'Service scheduled', status: 'done' },
    { key: 'provider_assigned', label: 'Pro Assigned', description: 'Your pro accepted the job', status: 'pending' },
    { key: 'on_the_way', label: 'On the Way', description: 'Heading to your location', status: 'pending' },
    { key: 'arrived', label: 'Arrived', description: 'Pro is at your property', status: 'pending' },
    { key: 'in_progress', label: 'In Progress', description: 'Service is being performed', status: 'pending' },
    { key: 'completed', label: 'Completed', description: 'Service finished', status: 'pending' },
  ]

  // Mark current and past steps
  const order = ['booked', 'provider_assigned', 'on_the_way', 'arrived', 'in_progress', 'completed']
  const currentIdx = order.indexOf(activeBooking.booking_status)
  timelineSteps.forEach((step, i) => {
    if (i < currentIdx) step.status = 'done'
    else if (i === currentIdx) step.status = 'current'
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Track Service</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {activeBooking.booking_status === 'completed' ? 'Completed Service' : 'Active Service'}
            </h3>
            <p className="text-slate-600 text-sm">
              {YARD_SIZE_LABELS[activeBooking.yard_size_category] || 'Lawn Service'}
            </p>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 text-sm ${
            activeBooking.booking_status === 'completed'
              ? 'bg-slate-100 text-slate-700'
              : activeBooking.booking_status === 'booked'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            {STATUS_ICONS[activeBooking.booking_status] || <Package size={16} />}
            {STATUS_LABELS[activeBooking.booking_status] || activeBooking.booking_status}
          </span>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="text-[#22C55E]" size={18} />
              <span className="text-slate-700 text-sm">
                {address
                  ? `${address.street_1}${address.street_2 ? `, ${address.street_2}` : ''}, ${address.city}, ${address.state} ${address.zip_code}`
                  : 'Service address'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="text-[#22C55E]" size={18} />
              <span className="text-slate-700 text-sm">
                {formatDate(activeBooking.scheduled_date)}
                {activeBooking.scheduled_time_window && ` at ${activeBooking.scheduled_time_window}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Scissors className="text-[#22C55E]" size={18} />
              <span className="text-slate-700 text-sm">${activeBooking.estimated_price}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 flex items-center gap-3 ${
          activeBooking.booking_status === 'booked'
            ? 'bg-amber-50'
            : activeBooking.booking_status === 'completed'
              ? 'bg-slate-50'
              : 'bg-blue-50'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            activeBooking.booking_status === 'booked'
              ? 'bg-amber-500'
              : activeBooking.booking_status === 'completed'
                ? 'bg-slate-500'
                : 'bg-blue-500'
          }`}>
            {activeBooking.booking_status === 'completed' ? (
              <CheckCircle className="text-white" size={20} />
            ) : activeBooking.booking_status === 'booked' ? (
              <Clock className="text-white" size={20} />
            ) : (
              <Car className="text-white" size={20} />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              activeBooking.booking_status === 'booked'
                ? 'text-amber-600'
                : activeBooking.booking_status === 'completed'
                  ? 'text-slate-600'
                  : 'text-blue-600'
            }`}>
              {activeBooking.booking_status === 'booked'
                ? 'Waiting for a pro to accept'
                : activeBooking.booking_status === 'completed'
                  ? 'Service complete'
                  : 'Live status'}
            </p>
            <p className={`text-base font-semibold ${
              activeBooking.booking_status === 'booked'
                ? 'text-amber-700'
                : activeBooking.booking_status === 'completed'
                  ? 'text-slate-700'
                  : 'text-blue-700'
            }`}>
              {STATUS_LABELS[activeBooking.booking_status] || 'Scheduled'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Status</h3>
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
          <div className="space-y-6">
            {timelineSteps.map((step, index) => (
              <div key={step.key} className="flex items-start gap-4 relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                    step.status === 'done'
                      ? 'bg-[#22C55E] text-white'
                      : step.status === 'current'
                        ? 'bg-[#22C55E] text-white ring-4 ring-green-100'
                        : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step.status === 'done' ? <CheckCircle size={16} /> : index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <span className={`font-medium block ${step.status !== 'pending' ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                    {step.status === 'current' && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </span>
                  <p className={`text-sm ${step.status !== 'pending' ? 'text-slate-600' : 'text-slate-400'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow" disabled>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
            <MessageCircle className="text-slate-400" size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-slate-400 text-sm">Message Pro</h3>
            <p className="text-slate-400 text-xs">Coming with Stripe</p>
          </div>
        </button>
        <button className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow" disabled>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
            <Camera className="text-slate-400" size={18} />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-slate-400 text-sm">Photos</h3>
            <p className="text-slate-400 text-xs">After completion</p>
          </div>
        </button>
      </div>
    </div>
  )
}
