import { useEffect, useState } from 'react'
import { getReviewForBooking, type Review } from '../lib/api'
import ReviewForm from './ReviewForm'
import FavoriteButton from './FavoriteButton'

/**
 * Shown only for completed bookings with an assigned pro.
 * - If the customer hasn't reviewed yet: prompts them to rate.
 * - If they have: shows their review with an "Edit" link.
 * Also shows the "Save to favorites" button.
 *
 * NOTE: this used to live inside TrackService.tsx, where it was orphaned by the
 * CustomerJobCard refactor — meaning customers had no way to review a pro from
 * the Track Service page at all. It now lives with the card.
 */
export default function RateYourProSection({
  booking,
  proName,
}: {
  booking: any
  proName: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [review, setReview] = useState<Review | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getReviewForBooking(booking.id).then((res) => {
      if (cancelled) return
      setReview(res.data)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [booking.id])

  return (
    <div className="border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⭐</span>
        <h4 className="text-sm font-semibold text-slate-900">How was {proName}?</h4>
      </div>

      {!loaded ? (
        <div className="h-12 bg-slate-50 rounded-lg animate-pulse" />
      ) : review ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={i <= review.rating ? 'text-amber-400' : 'text-slate-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-emerald-700 font-medium">Your review</span>
          </div>
          {review.comment && (
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{review.comment}</p>
          )}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-emerald-200">
            <button
              onClick={() => setShowForm(true)}
              className="text-xs text-emerald-700 font-medium hover:underline"
            >
              Edit
            </button>
            <FavoriteButton providerId={booking.provider_id} variant="compact" />
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-900 mb-2">
            Reviews help other customers find great pros. Takes 30 seconds.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 bg-[#22C55E] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#16A34A] transition-colors"
            >
              ★ Rate this pro
            </button>
            <FavoriteButton providerId={booking.provider_id} variant="compact" />
          </div>
        </div>
      )}

      {showForm && (
        <ReviewForm
          bookingId={booking.id}
          proName={proName}
          existingReview={review ? { rating: review.rating, comment: review.comment } : null}
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            getReviewForBooking(booking.id).then((res) => setReview(res.data))
          }}
        />
      )}
    </div>
  )
}
