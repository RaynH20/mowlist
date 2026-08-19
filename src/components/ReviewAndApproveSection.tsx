import { useState, useEffect } from 'react'
import {
  Shield, Timer, AlertTriangle, ThumbsUp, ThumbsDown, Loader2,
} from 'lucide-react'
import { getEscrowStatus, customerApproveBooking, customerDisputeBooking } from '../lib/api'

/**
 * ReviewAndApproveSection — shown only for `pending_review` bookings.
 * Lets the customer:
 *   - See all the before/after photos for the base + each addon
 *   - Approve & release payment (immediately captures the held payment)
 *   - Dispute (pauses payment, sends to admin review)
 *   - Auto-release happens 24h after pro marked the job done
 *
 * Used inside CustomerJobCard's expanded body so the review/approve
 * controls are always one tap away from the photos.
 */
export default function ReviewAndApproveSection({
  booking,
  proName,
  onAction,
  onApproved,
  onDisputed,
}: {
  booking: any
  proName: string
  /** Generic refresh. Only used when the specific callback below is absent. */
  onAction?: () => void
  /** Flip this booking to `completed` in the parent's state. */
  onApproved?: () => void
  /** Flip this booking to `disputed` in the parent's state. */
  onDisputed?: () => void
}) {
  const [approving, setApproving] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeSubmitted, setDisputeSubmitted] = useState(false)
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
    setShowApproveConfirm(false)
    setApproving(true)
    setError(null)
    const { error: err } = await customerApproveBooking(booking.id)
    setApproving(false)
    if (err) {
      setError(err.message)
      return
    }
    // The DB write is now verified — customerApproveBooking selects the row
    // back and errors if the UPDATE matched zero rows. So a success here
    // means the booking really is `completed` server-side, and we can flip
    // the parent's state directly without a re-fetch.
    if (onApproved) onApproved()
    else onAction?.()
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
    setDisputeSubmitted(true)
    // Previously this called onAction(), which on the Track Service page was
    // wired to "mark this booking completed" — so filing a dispute made the
    // card show as Completed. Dispute now has its own callback.
    if (onDisputed) onDisputed()
    else onAction?.()
  }

  return (
    <div className="space-y-3">
      {/* Success confirmation after dispute submit — shows briefly before the
          parent re-renders with the disputed status. The customer needs
          confirmation that something actually happened. */}
      {disputeSubmitted && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <ThumbsDown className="text-white" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-900">Dispute submitted</h3>
            <p className="text-sm text-red-800 mt-1">
              Your payment is held in escrow. {proName} has been notified and
              will fix the issue. We'll let you know as soon as the corrected
              version is ready for review.
            </p>
          </div>
        </div>
      )}

      {/* Header banner */}
      {!disputeSubmitted && (
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
      )}

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

      {/* Action buttons: Approve / Dispute — hidden once dispute is submitted
          (the success banner above is the new state). */}
      {!disputeSubmitted && !showDisputeForm ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setShowApproveConfirm(true)}
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

      {/* In-app approve confirmation modal — replaces the native window.confirm()
          so the design stays consistent and the user knows what's happening. */}
      {showApproveConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowApproveConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="text-emerald-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Approve and release payment?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-1">
              This will release the <strong>${escrow?.amount ?? booking.estimated_price}</strong> held in escrow
              to <strong>{proName}</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-5">
              This cannot be undone. If something looks off, you can dispute instead.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#22C55E] hover:bg-[#16A34A] rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {approving ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                Yes, approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
