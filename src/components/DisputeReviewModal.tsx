import { useState } from 'react'
import { X, AlertTriangle, Loader2, Check } from 'lucide-react'
import { disputeReview, type Review } from '../lib/api'

interface DisputeReviewModalProps {
  review: Review
  onClose: () => void
  onDisputed: () => void
}

/**
 * Pro uses this to dispute a review they think is fake or unfair.
 * Sets the review's status to 'disputed' which sends it to admin review.
 */
export default function DisputeReviewModal({ review, onClose, onDisputed }: DisputeReviewModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      setError('Please explain why you\'re disputing (at least 10 characters).')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: err } = await disputeReview(review.id, reason)
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    onDisputed()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Dispute this review</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Tell us why you think this review is unfair or inaccurate.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-slate-700">{review.customer_name || 'Customer'}</span>
            <span className="text-amber-500 text-sm">{'★'.repeat(review.rating)}</span>
          </div>
          {review.comment && (
            <p className="text-sm text-slate-600 italic">"{review.comment}"</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Why are you disputing this? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              minLength={10}
              maxLength={500}
              required
              placeholder="Example: Customer never actually booked this service. The job was for a different address, and this review is for a different pro."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              MowList will review your dispute within 24 hours. If upheld, the review is removed from your average.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || reason.trim().length < 10}
              className="flex-1 bg-amber-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Submit dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
