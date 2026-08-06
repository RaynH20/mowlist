import { CheckCircle, Clock, Truck, MapPin, Scissors, Award, XCircle, AlertCircle, Camera, MapPinned } from 'lucide-react'
import type { BookingStatus, Address } from '../lib/database.types'
import LiveTrackingMap from './LiveTrackingMap'
import ErrorBoundary from './ErrorBoundary'
import JobPhotoGallery from './JobPhotoGallery'

interface StatusStep {
  id: BookingStatus
  label: string
  description: string
  icon: typeof CheckCircle
}

const STATUS_FLOW: StatusStep[] = [
  { id: 'requested', label: 'Requested', description: 'Waiting for a pro to accept', icon: Clock },
  { id: 'booked', label: 'Confirmed', description: 'Pro is scheduled', icon: CheckCircle },
  { id: 'on_the_way', label: 'On the way', description: 'Pro is heading to you', icon: Truck },
  { id: 'arrived', label: 'Arrived', description: 'Pro is on site', icon: MapPin },
  { id: 'in_progress', label: 'Mowing', description: 'Service in progress', icon: Scissors },
  { id: 'completed', label: 'Completed', description: 'Job done — enjoy your lawn!', icon: Award },
]

/** Map a status to its index in the flow, handling special cases */
function getStatusIndex(status: BookingStatus): number {
  // Cancelled / disputed / refunded are terminal but not in the main flow
  if (status === 'cancelled') return -1
  if (status === 'disputed') return -1
  if (status === 'refunded') return -1
  if (status === 'provider_assigned') return 1 // treat same as "booked"
  if (status === 'in_progress') return 4
  if (status === 'completed') return 5
  return STATUS_FLOW.findIndex(s => s.id === status)
}

interface BookingStatusTrackerProps {
  status: BookingStatus
  compact?: boolean
  scheduledDate?: string | null
  scheduledTimeWindow?: string | null
  beforePhotoUrl?: string | null
  afterPhotoUrl?: string | null
  hasActiveTracking?: boolean
  /** Booking ID — needed to load live tracking pings */
  bookingId?: string
  /** Customer address for the map */
  address?: Address | null
  /** Initial pro position from booking */
  proLat?: number | null
  proLng?: number | null
}

export default function BookingStatusTracker({
  status,
  compact = false,
  scheduledDate,
  scheduledTimeWindow,
  beforePhotoUrl,
  afterPhotoUrl,
  hasActiveTracking = false,
  bookingId,
  address,
  proLat,
  proLng,
}: BookingStatusTrackerProps) {
  // Special terminal states
  if (status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
        <XCircle className="text-red-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-semibold text-red-900">Booking cancelled</h3>
          <p className="text-sm text-red-700 mt-1">
            This booking has been cancelled. If you have questions, please contact support.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'disputed') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3">
        <AlertCircle className="text-amber-500 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-semibold text-amber-900">Dispute under review</h3>
          <p className="text-sm text-amber-700 mt-1">
            Our team is reviewing this booking. We'll be in touch within 24 hours.
          </p>
        </div>
      </div>
    )
  }

  const currentIdx = getStatusIndex(status)

  return (
    <div className="space-y-6">
      {/* Scheduled info + live tracking indicator */}
      {(scheduledDate || hasActiveTracking) && (
        <div className="flex flex-wrap items-center gap-3">
          {scheduledDate && (
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-full">
              <Clock size={14} />
              {scheduledDate} {scheduledTimeWindow && `· ${scheduledTimeWindow}`}
            </div>
          )}
          {hasActiveTracking && (
            <div className="inline-flex items-center gap-2 bg-[#22C55E]/10 text-[#16A34A] text-sm font-semibold px-3 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full" />
              Live tracking active
            </div>
          )}
        </div>
      )}

      {/* Progress bar — desktop / tablet horizontal, mobile vertical */}
      <div className={compact ? '' : 'bg-white border border-slate-200 rounded-2xl p-6'}>
        <div className="flex flex-col md:flex-row gap-4 md:gap-0">
          {STATUS_FLOW.map((step, i) => {
            const isCompleted = i < currentIdx
            const isCurrent = i === currentIdx
            const isPending = i > currentIdx
            const Icon = step.icon

            return (
              <div
                key={step.id}
                className={`flex md:flex-col md:flex-1 items-start md:items-center gap-3 md:gap-2 ${
                  i > 0 ? 'md:relative' : ''
                }`}
              >
                {/* Connector line — desktop only */}
                {i > 0 && (
                  <div
                    className={`hidden md:block absolute top-5 -left-1/2 w-full h-0.5 ${
                      isCompleted || isCurrent ? 'bg-[#22C55E]' : 'bg-slate-200'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Circle with icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 ${
                    isCompleted
                      ? 'bg-[#22C55E] text-white'
                      : isCurrent
                      ? 'bg-[#22C55E] text-white ring-4 ring-[#22C55E]/20'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={20} /> : <Icon size={18} />}
                </div>

                {/* Label */}
                <div className="md:text-center md:mt-2">
                  <div
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-[#16A34A]' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </div>
                  {!compact && (
                    <div className={`text-xs mt-0.5 ${isPending ? 'text-slate-400' : 'text-slate-500'}`}>
                      {step.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Photo gallery (only when at least one photo exists).
          Customer side: view-only. Pro side: can add/delete via the
          allowUpload prop in the pro's job card. */}
      {(beforePhotoUrl || afterPhotoUrl) && bookingId && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Camera size={18} className="text-slate-500" />
            Job photos
          </h3>
          <JobPhotoGallery bookingId={bookingId} allowUpload={false} />
        </div>
      )}

      {/* Live tracking map — only when booking is in an active state.
          Wrapped in ErrorBoundary so a map issue never crashes the page.
          Only renders the map if we have pro coords or customer coords —
          otherwise shows a simple status banner. */}
      {hasActiveTracking && bookingId && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPinned className="text-blue-600" size={20} />
            <h3 className="font-semibold text-slate-900">Your pro is on the way</h3>
          </div>
          {(proLat != null && proLng != null) || (address && (address as any).lat && (address as any).lng) ? (
            <ErrorBoundary name="LiveTrackingMap">
              <LiveTrackingMap
                bookingId={bookingId}
                address={address ?? null}
                initialProLat={proLat}
                initialProLng={proLng}
                active={['on_the_way', 'arrived', 'in_progress'].includes(status)}
              />
            </ErrorBoundary>
          ) : (
            <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-start gap-3">
              <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">Your pro is heading to you</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live map tracking will appear here as soon as your pro's location is available.
                </p>
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">
            🔒 Your pro's location is only visible while the job is active. Tracking automatically ends when the job is marked complete. We never track outside of an active booking.
          </p>
        </div>
      )}
    </div>
  )
}
