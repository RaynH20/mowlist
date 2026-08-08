import { hydrateAddons } from '../lib/addons'

interface AddonBadgesProps {
  selectedAddons: any[] | null | undefined
  variant?: 'inline' | 'chips' | 'card'
  showPrices?: boolean
  className?: string
}

/**
 * Display a booking's selected add-ons. Renders nothing if no add-ons.
 *
 * Variants:
 * - 'inline': compact list like "✂️ Edging · 🍂 Leaf Blowing"  (for tight rows)
 * - 'chips': individual pill-shaped chips (for cards/expanded views)
 * - 'card': vertical list with prices, like a mini receipt
 */
export default function AddonBadges({
  selectedAddons,
  variant = 'chips',
  showPrices = true,
  className = '',
}: AddonBadgesProps) {
  const addons = hydrateAddons(selectedAddons)
  if (addons.length === 0) return null

  if (variant === 'inline') {
    return (
      <p className={`text-xs text-slate-600 ${className}`}>
        {addons.map((a) => `${a.icon} ${a.name}`).join(' · ')}
      </p>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`bg-slate-50 rounded-lg border border-slate-100 p-3 ${className}`}>
        <p className="text-xs font-semibold text-slate-700 mb-1.5">Add-ons</p>
        <ul className="space-y-1">
          {addons.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-xs">
              <span className="text-slate-700">
                <span className="mr-1">{a.icon}</span>
                {a.name}
              </span>
              {showPrices && (
                <span className="font-medium text-slate-900">+${a.price}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // 'chips' (default)
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {addons.map((a) => (
        <span
          key={a.id}
          className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full"
          title={a.description}
        >
          <span>{a.icon}</span>
          <span className="font-medium">{a.name}</span>
          {showPrices && (
            <span className="text-amber-700">+${a.price}</span>
          )}
        </span>
      ))}
    </div>
  )
}
