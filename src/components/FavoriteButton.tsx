import { useEffect, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { addFavorite, isFavorited, removeFavorite } from '../lib/api'

interface FavoriteButtonProps {
  providerId: string
  /** "icon" (just heart), "compact" (heart + "Save"), "full" (heart + "Save this pro") */
  variant?: 'icon' | 'compact' | 'full'
  className?: string
  onChange?: (isFavorited: boolean) => void
}

/**
 * Toggle button for adding/removing a pro from the customer's favorites.
 * Shows current state automatically.
 */
export default function FavoriteButton({
  providerId,
  variant = 'compact',
  className = '',
  onChange,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!providerId) return
    let cancelled = false
    setLoading(true)
    isFavorited(providerId)
      .then((res) => {
        if (cancelled) return
        setFavorited(res.isFavorited)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [providerId])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    // Optimistic
    const next = !favorited
    setFavorited(next)
    onChange?.(next)
    try {
      if (next) {
        const { error } = await addFavorite(providerId)
        if (error) throw error
      } else {
        const { error } = await removeFavorite(providerId)
        if (error) throw error
      }
    } catch (err) {
      // Revert on failure
      setFavorited(!next)
      onChange?.(!next)
      console.error('Favorite toggle failed:', err)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className={`text-slate-300 ${className}`}
        aria-label="Loading favorite status"
      >
        <Loader2 size={18} className="animate-spin" />
      </button>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggle}
        disabled={busy}
        className={`p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 ${className}`}
        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        title={favorited ? 'Saved' : 'Save this pro'}
      >
        <Heart
          size={18}
          className={favorited ? 'fill-red-500 text-red-500' : 'text-slate-400'}
        />
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleToggle}
        disabled={busy}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
          favorited
            ? 'bg-red-50 text-red-600 hover:bg-red-100'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        } ${className}`}
      >
        <Heart
          size={14}
          className={favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}
        />
        {favorited ? 'Saved' : 'Save'}
      </button>
    )
  }

  // 'full' variant
  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
        favorited
          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
      } ${className}`}
    >
      <Heart
        size={16}
        className={favorited ? 'fill-red-500 text-red-500' : 'text-slate-500'}
      />
      {favorited ? 'Saved to favorites' : 'Save this pro'}
    </button>
  )
}
