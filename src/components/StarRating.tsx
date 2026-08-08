import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  reviewCount?: number
  className?: string
}

const SIZES = {
  sm: 14,
  md: 20,
  lg: 28,
}

/**
 * Reusable 5-star rating component.
 * - If onChange is provided, it's interactive (hover + click).
 * - Otherwise it's display-only.
 */
export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showNumber = false,
  reviewCount,
  className = '',
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const px = SIZES[size]
  const interactive = !!onChange && !readOnly

  const displayValue = hovered ?? value

  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(displayValue)
        const half = !filled && i - 0.5 <= displayValue
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i)}
            onMouseEnter={() => interactive && setHovered(i)}
            onMouseLeave={() => interactive && setHovered(null)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform p-0.5`}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
          >
            <Star
              size={px}
              className={filled || half ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
              strokeWidth={filled ? 0 : 1.5}
            />
          </button>
        )
      })}
      {showNumber && (
        <span className="ml-1.5 text-sm font-semibold text-slate-900">
          {value.toFixed(1)}
        </span>
      )}
      {showNumber && reviewCount != null && (
        <span className="ml-1 text-xs text-slate-500">
          ({reviewCount})
        </span>
      )}
    </div>
  )
}
