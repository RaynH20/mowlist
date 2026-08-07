import { User } from 'lucide-react'

interface ProAvatarProps {
  imageUrl?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
}

const ICON_SIZE = {
  sm: 12,
  md: 16,
  lg: 20,
}

/**
 * Circular avatar for showing a pro's photo. Falls back to initials.
 */
export default function ProAvatar({ imageUrl, name, size = 'md', className = '' }: ProAvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?P'

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'Pro'}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover border border-slate-200 ${className}`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.currentTarget
          target.style.display = 'none'
          const sibling = target.nextElementSibling as HTMLElement | null
          if (sibling) sibling.style.display = 'flex'
        }}
      />
    )
  }

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full bg-gradient-to-br from-[#22C55E] to-[#1E40AF] text-white font-semibold flex items-center justify-center flex-shrink-0 ${className}`}
      title={name || 'Pro'}
    >
      {initials === '?P' ? <User size={ICON_SIZE[size]} /> : initials}
    </div>
  )
}
