import { AlertCircle, Clock, Shield } from 'lucide-react'

/**
 * Shown when booking status is 'disputed' — the customer filed a dispute and is
 * waiting for the pro to re-fix the issue. No action buttons; just a clear
 * status explaining what's happening and when to expect an update.
 *
 * The pro sees the dispute reason on their side and is expected to either
 * re-do the work (which puts the booking back in pending_review with a fresh
 * 24h window) or contact the customer to resolve.
 *
 * NOTE: this used to live inside TrackService.tsx, where it was orphaned by the
 * CustomerJobCard refactor and never rendered. It now lives with the card.
 */
export default function DisputedWaitingSection({
  booking,
  proName,
}: {
  booking: any
  proName: string
}) {
  const disputeAge = booking.disputed_at
    ? Math.floor((Date.now() - new Date(booking.disputed_at).getTime()) / 3_600_000)
    : 0

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertCircle className="text-white" size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-900">You've disputed this job</h3>
          <p className="text-sm text-red-800 mt-1">
            We notified {proName} about the issue. They're expected to re-do the
            work and send it back for your review.
          </p>
        </div>
      </div>

      {booking.dispute_reason && (
        <div className="bg-white border border-red-200 rounded-lg p-3 mb-3">
          <p className="text-xs font-semibold text-slate-600 mb-1">Your reason:</p>
          <p className="text-sm text-slate-800 italic">"{booking.dispute_reason}"</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-red-700">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Disputed {disputeAge === 0 ? 'today' : `${disputeAge}h ago`}
        </span>
        <span className="flex items-center gap-1">
          <Shield size={12} />
          Payment held in escrow
        </span>
        {booking.dispute_count > 1 && (
          <span className="flex items-center gap-1 text-amber-700">
            <AlertCircle size={12} />
            Re-opened {booking.dispute_count} times
          </span>
        )}
      </div>

      <p className="text-xs text-red-700 mt-3 italic">
        You'll get a fresh 24-hour review window when the pro sends the corrected
        version back. If they don't respond within 48 hours, our support team
        will step in.
      </p>
    </div>
  )
}
