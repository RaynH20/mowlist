import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin, Clock, ChevronDown, ChevronUp, Phone, ExternalLink, AlertCircle,
  Loader2, CheckCircle, Camera, Shield, FileText, DollarSign, User
} from 'lucide-react'
import type { ProBookingWithDetails } from '../lib/proDashboard'
import { serviceTypeLabel, yardSizeLabel, serviceFrequencyLabel, formatBookingStatus } from '../lib/labels'
import { hydrateAddons } from '../lib/addons'
import PerServicePhotoUploader from './PerServicePhotoUploader'
import CustomerPhotoViewer from './CustomerPhotoViewer'
import AddonBadges from './AddonBadges'
import ProStatusStepper from './ProStatusStepper'

export type ProJobCardSize = 'compact' | 'full'

interface ProJobCardProps {
  job: ProBookingWithDetails

  // Visual variant
  size?: ProJobCardSize

  // Collapsed/expanded state (controlled by parent)
  expanded: boolean
  onToggle: () => void

  // Action handlers (pro only)
  onUpdate?: (job: ProBookingWithDetails, status: 'on_the_way' | 'arrived' | 'in_progress' | 'completed') => void
  onMarkReadyForReview?: (job: ProBookingWithDetails) => void
  onAccept?: (job: ProBookingWithDetails) => void
  onDecline?: (job: ProBookingWithDetails) => void
  actionInProgress?: boolean

  // Where to link for "Open full details" — defaults to /pro/jobs
  detailsLink?: string

  // If true, the action button row is hidden (used when this card is just a
  // status summary, not an actionable item)
  hideActions?: boolean

  // If true, photo uploader re-fetches the booking after a successful upload
  onPhotoUploaded?: () => void
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

// Statuses where the pro should accept (not yet claimed)
const CLAIMABLE_STATUSES = new Set(['requested', 'booked'])

/**
 * ProJobCard — the single source of truth for how a pro's job looks
 * anywhere in the app (Dashboard / Available Jobs / My Jobs). The same
 * card component is used everywhere so the same booking renders identically
 * regardless of which page it appears on.
 *
 * Two states:
 *   - Collapsed (header only): customer name, address, date+time, status
 *     badge, payout. Used in lists.
 *   - Expanded: full details + actions. Triggered by onToggle.
 */
export default function ProJobCard({
  job,
  size = 'full',
  expanded,
  onToggle,
  onUpdate,
  onMarkReadyForReview,
  onAccept,
  onDecline,
  actionInProgress = false,
  detailsLink = '/pro/jobs',
  hideActions = false,
  onPhotoUploaded,
}: ProJobCardProps) {
  const badge = STATUS_BADGE[job.booking_status] || { bg: 'bg-slate-100', text: 'text-slate-700' }
  const badgeLabel = badge.label || formatBookingStatus(job.booking_status)
  const isClaimable = CLAIMABLE_STATUSES.has(job.booking_status)
  const isDisputed = job.booking_status === 'disputed'
  const isPendingReview = job.booking_status === 'pending_review'
  const isCompleted = job.booking_status === 'completed'

  // Photo gate for the action buttons
  const requiresBeforePhoto = job.booking_status === 'arrived' && !job.before_photo_url
  const requiresAfterPhoto = job.booking_status === 'in_progress' && !job.after_photo_url

  // The action button — for active jobs, walks through the flow. For
  // disputed/in_progress, the "Mark Ready for Review" button is shown.
  const activeAction = getActiveAction(job.booking_status)
  const canPerformAction = !!activeAction && !requiresBeforePhoto && !requiresAfterPhoto

  // Status flow steps for the expanded view
  const flowSteps = [
    { key: 'on_the_way', label: 'On way' },
    { key: 'arrived', label: 'Arrived' },
    { key: 'in_progress', label: 'Working' },
    { key: 'pending_review', label: 'Review' },
    { key: 'completed', label: 'Done' },
  ]
  const currentStepIndex = flowSteps.findIndex((s) => s.key === job.booking_status)

  const customerInitials = (job.customer_name || 'C')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
  const statusBorder = STATUS_BORDER[job.booking_status] || 'border-l-slate-300'

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${statusBorder} transition-all overflow-hidden ${
        expanded ? 'shadow-md' : 'hover:border-slate-300'
      }`}
    >
      {/* ============= COLLAPSED HEADER ============= */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3"
        aria-expanded={expanded}
      >
        {/* Customer avatar — neutral background, not a status indicator */}
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
          {job.customer_avatar_url ? (
            <img
              src={job.customer_avatar_url}
              alt={job.customer_name || 'Customer'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            customerInitials
          )}
        </div>

        {/* Center: customer name + meta */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {job.customer_name || 'Customer'}
          </p>
          <p className="text-xs text-slate-600 truncate flex items-center gap-1 mt-0.5">
            <Clock size={11} className="flex-shrink-0" />
            <span>{formatProDate(job.scheduled_date)}</span>
            {job.scheduled_time_window && (
              <>
                <span className="text-slate-400">·</span>
                <span>{job.scheduled_time_window}</span>
              </>
            )}
          </p>
          {job.address_line && (
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="flex-shrink-0" />
              <span>{truncateAddress(job.address_line)}, {job.address_city}</span>
            </p>
          )}
        </div>

        {/* Right: payout + status badge */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-[#22C55E] tabular-nums">
            ${(job.provider_payout_amount ?? job.estimated_price ?? 0).toFixed(0)}
          </p>
          <span
            className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${badge.bg} ${badge.text}`}
          >
            {badgeLabel}
          </span>
          {size === 'full' && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              {yardSizeLabel(job.yard_size_category)}
            </p>
          )}
        </div>

        {/* Chevron */}
        {size === 'full' && (
          <div className="flex-shrink-0 self-center">
            {expanded ? (
              <ChevronUp size={18} className="text-slate-400" />
            ) : (
              <ChevronDown size={18} className="text-slate-400" />
            )}
          </div>
        )}
      </button>

      {/* ============= EXPANDED BODY ============= */}
      {expanded && size === 'full' && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Status flow (skip if claimable or completed) */}
          {!isClaimable && !isCompleted && job.booking_status !== 'cancelled' && (
            <ProStatusStepper status={job.booking_status} />
          )}

          {/* Disputed banner */}
          {isDisputed && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="text-white" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-900">Customer disputed this job</h4>
                  <p className="text-xs text-red-700 mt-0.5">
                    ${(job.provider_payout_amount || 0).toFixed(2)} is being held in escrow.
                    Upload a corrected After photo for the affected service, then send it back for review.
                  </p>
                </div>
              </div>
              {(job as any).dispute_reason && (
                <div className="bg-white border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Their reason:</p>
                  <p className="text-sm text-slate-800 italic">"{(job as any).dispute_reason}"</p>
                </div>
              )}
            </div>
          )}

          {/* Service details grid */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Service</p>
              <p className="font-medium text-slate-900">{serviceTypeLabel(job.service_type)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Frequency</p>
              <p className="font-medium text-slate-900 capitalize">
                {serviceFrequencyLabel(job.service_frequency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Yard</p>
              <p className="font-medium text-slate-900">{yardSizeLabel(job.yard_size_category)}</p>
            </div>
          </div>

          {/* Customer notes */}
          {job.notes && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <FileText size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">Customer notes</p>
                <p className="text-sm text-slate-800 whitespace-pre-line">{job.notes}</p>
              </div>
            </div>
          )}

          {/* Customer addons */}
          {Array.isArray((job as any).selected_addons) && (job as any).selected_addons.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Customer add-ons</p>
              <AddonBadges selectedAddons={(job as any).selected_addons} variant="chips" />
            </div>
          )}

          {/* Contact row */}
          <div className="flex items-center gap-3 flex-wrap">
            {job.customer_phone && (
              <a
                href={`tel:${job.customer_phone}`}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Phone size={14} />
                {job.customer_phone}
              </a>
            )}
            {job.address_latitude && job.address_longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${job.address_line}, ${job.address_city}, ${job.address_state} ${job.address_zip}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink size={14} />
                Open in Google Maps
              </a>
            )}
          </div>

          {/* Photo section — only shown once pro is actually on-site or further.
              Earlier states (booked / on_the_way) shouldn't see the uploader —
              no point taking photos before you've arrived. */}
          {!isCompleted && job.booking_status !== 'cancelled' &&
            ['arrived', 'in_progress', 'mowing', 'pending_review'].includes(job.booking_status) && (
            <div>
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                Job photos
              </p>
              <PerServicePhotoUploader
                bookingId={job.id}
                selectedAddons={hydrateAddons((job as any).selected_addons)}
                onPhotoUploaded={onPhotoUploaded}
              />
            </div>
          )}
          {isCompleted && (
            <div>
              <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">
                Photos you uploaded
              </p>
              <CustomerPhotoViewer
                bookingId={job.id}
                selectedAddons={(job as any).selected_addons}
                reviewStatus="approved"
              />
            </div>
          )}

          {/* Action buttons */}
          {!hideActions && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {/* Claimable: Accept / Decline */}
              {isClaimable && onAccept && onDecline && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onDecline(job)}
                    disabled={actionInProgress}
                    className="bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAccept(job)}
                    disabled={actionInProgress}
                    className="bg-[#22C55E] text-white py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionInProgress ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Accept job
                  </button>
                </div>
              )}

              {/* Active flow: On the way / Arrived / Start work / Mark complete */}
              {activeAction && onUpdate && !isDisputed && (
                <>
                  {(requiresBeforePhoto || requiresAfterPhoto) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-amber-900">
                        📸 {requiresBeforePhoto
                          ? 'Add a Before photo for Lawn Mowing in the box above to start work'
                          : 'Add an After photo for Lawn Mowing in the box above to mark complete'}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => onUpdate(job, activeAction as any)}
                    disabled={!canPerformAction || actionInProgress}
                    className="w-full bg-[#22C55E] text-white py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {actionInProgress ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {getActionLabel(activeAction)}
                  </button>
                </>
              )}

              {/* Disputed OR in_progress: Send for review (red if disputed) */}
              {(isDisputed || job.booking_status === 'in_progress') && onMarkReadyForReview && (
                <button
                  onClick={() => onMarkReadyForReview(job)}
                  disabled={actionInProgress}
                  className={`w-full text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md ${
                    isDisputed
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                      : 'bg-gradient-to-r from-emerald-500 to-[#22C55E] hover:from-emerald-600 hover:to-[#16A34A]'
                  }`}
                >
                  {actionInProgress ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Shield size={18} />
                  )}
                  {isDisputed ? 'Send Fixed Version for Re-Review' : 'Mark Ready for Customer Review'}
                </button>
              )}

              {/* Open full details link */}
              <Link
                to={`${detailsLink}?booking=${job.id}`}
                className="inline-flex items-center gap-1 text-xs text-[#22C55E] font-medium hover:underline"
              >
                Open full details →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getActiveAction(status: string): 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | null {
  switch (status) {
    case 'provider_assigned': return 'on_the_way'
    case 'on_the_way': return 'arrived'
    case 'arrived': return 'in_progress'
    case 'in_progress': return 'completed'
    default: return null
  }
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'on_the_way': return "I'm on the way"
    case 'arrived': return "I've arrived"
    case 'in_progress': return 'Start work'
    case 'completed': return 'Mark complete'
    default: return 'Continue'
  }
}

function formatProDate(d: string | null): string {
  if (!d) return 'TBD'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    })
  } catch {
    return d
  }
}

function truncateAddress(addr: string): string {
  return addr.split(',')[0].trim()
}
