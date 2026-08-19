import { useState, useEffect } from 'react'
import {
  MapPin, Clock, ChevronDown, ChevronUp, Phone, ExternalLink, AlertCircle,
  Loader2, Camera, Shield, Scissors, AlertTriangle, CheckCircle2
} from 'lucide-react'
import type { Booking, Address } from '../lib/database.types'
import { yardSizeLabel, formatBookingStatus } from '../lib/labels'
import { hydrateAddons } from '../lib/addons'
import CustomerPhotoViewer from './CustomerPhotoViewer'
import AddonBadges from './AddonBadges'
import BookingStatusTracker from './BookingStatusTracker'
import ReviewAndApproveSection from './ReviewAndApproveSection'
import DisputedWaitingSection from './DisputedWaitingSection'
import RateYourProSection from './RateYourProSection'
import ErrorBoundary from './ErrorBoundary'
import { markBookingAsReviewed } from '../lib/api'

interface CustomerJobCardProps {
  booking: Booking
  address?: Address | null
  expanded: boolean
  onToggle: () => void
  onAction?: () => void  // generic re-fetch callback after mutations
  onApproved?: () => void  // flip this booking to completed in parent state
  onDisputed?: () => void  // flip this booking to disputed in parent state
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label?: string }> = {
  requested:           { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Awaiting Pro' },
  booked:              { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Booked' },
  provider_assigned:   { bg: 'bg-blue-100', text: 'text-blue-700' },
  on_the_way:          { bg: 'bg-blue-100', text: 'text-blue-700' },
  arrived:             { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  in_progress:         { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  pending_review:      { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  completed:           { bg: 'bg-slate-200', text: 'text-slate-700' },
  cancelled:           { bg: 'bg-slate-100', text: 'text-slate-500' },
  disputed:            { bg: 'bg-red-100', text: 'text-red-700' },
  refunded:            { bg: 'bg-slate-200', text: 'text-slate-700' },
}

/**
 * CustomerJobCard — the single source of truth for how a customer's
 * booking looks in the Track Service list and any other customer-facing
 * surface that needs to show jobs.
 *
 * Two states:
 *   - Collapsed: pro name (or "Awaiting Pro"), date+time, short address,
 *     price, status badge, color-coded icon.
 *   - Expanded: full status tracker, photos (read-only), addons, action
 *     buttons (Approve/Dispute for pending_review).
 */
export default function CustomerJobCard({
  booking,
  address,
  expanded,
  onToggle,
  onAction,
  onApproved,
  onDisputed,
}: CustomerJobCardProps) {
  const badge = STATUS_BADGE[booking.booking_status] || { bg: 'bg-slate-100', text: 'text-slate-700' }
  const badgeLabel = badge.label || formatBookingStatus(booking.booking_status)
  const proName = (booking as any).provider_name || null
  const proImage = (booking as any).provider_image_url || null
  const isPendingReview = booking.booking_status === 'pending_review'
  const isDisputed = booking.booking_status === 'disputed'
  const isCompleted = booking.booking_status === 'completed'
  const isCancelled = booking.booking_status === 'cancelled'
  const proInitials = (proName || '?')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const shortAddress = address
    ? `${address.street_1.split(',')[0].split(' ').slice(0, 4).join(' ')}${address.city ? `, ${address.city}` : ''}`
    : null

  // Stamp `reviewed_at` the first time the customer actually opens a job that's
  // awaiting their review. (Analytics only — it doesn't change the status.)
  useEffect(() => {
    if (expanded && isPendingReview && !(booking as any).reviewed_at) {
      markBookingAsReviewed(booking.id).catch(() => {})
    }
  }, [expanded, isPendingReview, booking])

  // Status color for the left border bar (the only color signal on the card)
  const STATUS_BORDER: Record<string, string> = {
    requested:        'border-l-orange-500',
    booked:           'border-l-emerald-500',
    provider_assigned: 'border-l-blue-500',
    on_the_way:       'border-l-blue-600',
    arrived:          'border-l-indigo-500',
    in_progress:      'border-l-cyan-500',
    pending_review:   'border-l-yellow-500',
    completed:        'border-l-slate-400',
    cancelled:        'border-l-slate-300',
    disputed:         'border-l-red-500',
    refunded:         'border-l-slate-400',
  }
  const statusBorder = STATUS_BORDER[booking.booking_status] || 'border-l-slate-300'

  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 ${statusBorder} transition-all overflow-hidden bg-white ${
        expanded ? 'shadow-md' : 'hover:border-slate-300'
      }`}
    >
      {/* ============= COLLAPSED HEADER ============= */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center gap-3 text-left"
        aria-expanded={expanded}
      >
        {/* Pro avatar — neutral background, not a status indicator */}
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
          {proImage ? (
            <img
              src={proImage}
              alt={proName || 'Pro'}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <span className="text-white font-semibold text-sm">
              {proName ? proInitials : <Scissors size={16} />}
            </span>
          )}
        </div>

        {/* Center: pro name + meta */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-slate-900 text-sm truncate">
            {proName || 'Awaiting Pro'}
          </p>
          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
            <Clock size={11} className="flex-shrink-0" />
            <span>{formatDate(booking.scheduled_date)}</span>
            {booking.scheduled_time_window && (
              <>
                <span className="text-slate-400">·</span>
                <span>{booking.scheduled_time_window}</span>
              </>
            )}
            {shortAddress && (
              <>
                <span className="text-slate-400">·</span>
                <span className="truncate">{shortAddress}</span>
              </>
            )}
          </p>
        </div>

        {/* Right: price + status badge */}
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-slate-900 tabular-nums">
            ${(booking.estimated_price || 0).toFixed(0)}
          </div>
          <span
            className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${badge.bg} ${badge.text}`}
          >
            {badgeLabel}
          </span>
        </div>

        {expanded ? (
          <ChevronUp size={18} className="text-slate-400 flex-shrink-0 self-center" />
        ) : (
          <ChevronDown size={18} className="text-slate-400 flex-shrink-0 self-center" />
        )}
      </button>

      {/* ============= EXPANDED BODY ============= */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 space-y-3 pt-3">
          {/* Status tracker + photos + approve/dispute UI.
              The tracker handles its own context (disputed vs pending_review vs
              completed) so we just pass the booking through. */}
          <ErrorBoundary name={`Tracker-${booking.id}`}>
            <BookingStatusTracker
              status={booking.booking_status as any}
              bookingId={booking.id}
              address={address ?? null}
              selectedAddons={(booking as any).selected_addons}
              scheduledDate={booking.scheduled_date}
              scheduledTimeWindow={booking.scheduled_time_window}
              beforePhotoUrl={booking.before_photo_url}
              afterPhotoUrl={booking.after_photo_url}
              proLat={(booking as any).pro_lat}
              proLng={(booking as any).pro_lng}
              hasActiveTracking={['on_the_way', 'arrived', 'in_progress'].includes(
                booking.booking_status
              )}
            />
          </ErrorBoundary>

          {/* Addons */}
          {Array.isArray((booking as any).selected_addons) && (booking as any).selected_addons.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Add-ons for this job</p>
              <AddonBadges selectedAddons={(booking as any).selected_addons} variant="chips" />
            </div>
          )}

          {/* 24h escrow review window — pro marked the job done, customer's turn.
              Shown directly inside the card so the review/approve controls are
              one tap away from the photos above. */}
          {isPendingReview && (booking as any).provider_id && (onApproved || onAction) && (
            <ReviewAndApproveSection
              booking={booking}
              proName={(booking as any).provider_name || 'your pro'}
              onAction={onAction}
              onApproved={onApproved}
              onDisputed={onDisputed}
            />
          )}

          {/* Disputed — customer is waiting for the pro to re-do the work. */}
          {isDisputed && (
            <DisputedWaitingSection
              booking={booking}
              proName={(booking as any).provider_name || 'your pro'}
            />
          )}

          {/* Completed — ask for a rating. */}
          {isCompleted && (booking as any).provider_id && (
            <RateYourProSection
              booking={booking}
              proName={(booking as any).provider_name || 'your pro'}
            />
          )}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string | null): string {
  if (!iso) return 'TBD'
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return iso
  }
}
