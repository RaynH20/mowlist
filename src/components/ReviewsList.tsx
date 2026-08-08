import { Star, Loader2, AlertCircle, Flag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getReviewsForProvider, type Review } from '../lib/api'
import StarRating from './StarRating'
import ProAvatar from './ProAvatar'
import DisputeReviewModal from './DisputeReviewModal'

interface ReviewsListProps {
  providerId: string
  /** When true, shows a "Dispute" button on each review (for pro's own view) */
  allowDispute?: boolean
  limit?: number
  className?: string
  /** Optional refresh trigger — increment to refetch */
  refreshKey?: number
  /** Called after a successful dispute */
  onDisputed?: () => void
}

/**
 * Renders a list of reviews for a pro. Used on the customer's job card
 * (expanded view) and the pro's own dashboard.
 */
export default function ReviewsList({
  providerId,
  allowDispute = false,
  limit = 20,
  className = '',
  refreshKey,
  onDisputed,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disputingReview, setDisputingReview] = useState<Review | null>(null)

  const refetch = () => {
    if (!providerId) return
    let cancelled = false
    setLoading(true)
    getReviewsForProvider(providerId, limit)
      .then((res) => {
        if (cancelled) return
        if (res.error) setError(res.error.message)
        else setReviews(res.data || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }

  useEffect(() => {
    const cleanup = refetch()
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, limit, refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="animate-spin text-slate-400" size={20} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-red-700">Couldn't load reviews: {error}</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500">
        <Star className="mx-auto text-slate-300 mb-2" size={24} />
        No reviews yet. Be the first to leave one after your next mow.
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {reviews.map((review) => (
        <div key={review.id} className="flex items-start gap-3">
          {review.customer_avatar_url ? (
            <img
              src={review.customer_avatar_url}
              alt={review.customer_name || 'Customer'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <ProAvatar
              imageUrl={null}
              name={review.customer_name}
              size="sm"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-medium text-slate-900 truncate">
                {review.customer_name || 'Customer'}
              </p>
              <StarRating value={review.rating} size="sm" readOnly />
              <span className="text-xs text-slate-400">
                {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {allowDispute && review.dispute_status === 'none' && (
                <button
                  onClick={() => setDisputingReview(review)}
                  className="text-xs text-slate-400 hover:text-amber-600 inline-flex items-center gap-1 ml-auto"
                  title="Dispute this review"
                >
                  <Flag size={11} />
                  Dispute
                </button>
              )}
            </div>
            {review.comment && (
              <p className="text-sm text-slate-700 whitespace-pre-line mt-1">
                {review.comment}
              </p>
            )}
            {review.dispute_status === 'disputed' && (
              <p className="text-xs text-amber-600 mt-1 italic">
                Under review by MowList
              </p>
            )}
            {review.dispute_status === 'upheld' && (
              <p className="text-xs text-emerald-600 mt-1 italic">
                Dispute upheld — this review has been removed from your average
              </p>
            )}
          </div>
        </div>
      ))}

      {disputingReview && (
        <DisputeReviewModal
          review={disputingReview}
          onClose={() => setDisputingReview(null)}
          onDisputed={() => {
            onDisputed?.()
            refetch()
          }}
        />
      )}
    </div>
  )
}
