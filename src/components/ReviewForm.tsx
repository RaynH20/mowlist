import { useState } from 'react'
import { X, Loader2, Check, MessageSquare } from 'lucide-react'
import StarRating from './StarRating'
import { submitReview } from '../lib/api'

interface ReviewFormProps {
  bookingId: string
  proName: string
  existingReview?: {
    rating: number
    comment: string | null
  } | null
  onClose: () => void
  onSubmitted: () => void
}

/**
 * Modal-style review form. Lets the customer rate a pro 1-5 stars and
 * write an optional comment. One review per booking — if the customer
 * already reviewed, this becomes an edit form.
 */
export default function ReviewForm({
  bookingId,
  proName,
  existingReview,
  onClose,
  onSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0)
  const [comment, setComment] = useState<string>(existingReview?.comment || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Please pick a star rating.')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: err } = await submitReview(bookingId, rating, comment || null)
    setSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    onSubmitted()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {existingReview ? 'Edit your review' : 'Rate your pro'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              How was your mow with {proName}?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star picker */}
          <div className="text-center py-3">
            <StarRating
              value={rating}
              onChange={setRating}
              size="lg"
            />
            <p className="text-sm text-slate-500 mt-2">
              {rating === 0 ? 'Tap a star to rate' :
                rating === 1 ? 'Poor' :
                rating === 2 ? 'Fair' :
                rating === 3 ? 'Good' :
                rating === 4 ? 'Great' :
                'Excellent!'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Comments <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-slate-400" size={16} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="What did you like? Anything that could be better?"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent resize-none"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">
              {comment.length}/500
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
              disabled={submitting || rating < 1}
              className="flex-1 bg-[#22C55E] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {existingReview ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
