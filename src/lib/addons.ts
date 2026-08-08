// ============================================
// MowList Add-ons Catalog
// ============================================
// Single source of truth for the add-on services that customers can
// add to a Lawn Mowing booking. Mirrors the services pros can offer
// in their profile (src/pages/pro/ProProfile.tsx).
//
// Pricing model: each add-on has a fixed price that's added to the
// base lawn-mowing total. Pro keeps 80% of the full total, platform
// keeps 20% (same as base).
//
// All add-ons are LAWN MOWING add-ons only — they can't be booked
// standalone. If the customer just wants one of these, they should
// request a custom quote.
//
// Schema in DB: bookings.selected_addons JSONB
// Format: [{ id: 'edging', name: 'Edging', price: 15, icon: '✂️' }, ...]

export interface Addon {
  id: string
  name: string
  price: number
  icon: string
  description: string
}

export const ADDON_CATALOG: Addon[] = [
  {
    id: 'edging',
    name: 'Edging',
    price: 15,
    icon: '✂️',
    description: 'Crisp edge trimming along walks, driveways, and beds',
  },
  {
    id: 'leaf_blowing',
    name: 'Leaf Blowing',
    price: 20,
    icon: '🍂',
    description: 'Blow off driveways, walkways, and patio after mowing',
  },
  {
    id: 'hedge_trimming',
    name: 'Hedge Trimming',
    price: 45,
    icon: '🌳',
    description: 'Shape and trim hedges, shrubs, and small bushes',
  },
  {
    id: 'fertilization',
    name: 'Fertilization',
    price: 55,
    icon: '🌾',
    description: 'Seasonal fertilizer application for greener, thicker grass',
  },
  {
    id: 'weed_control',
    name: 'Weed Control',
    price: 35,
    icon: '🌿',
    description: 'Spot treatment of broadleaf weeds in lawn and beds',
  },
  {
    id: 'aeration',
    name: 'Lawn Aeration',
    price: 65,
    icon: '💨',
    description: 'Core aeration to relieve soil compaction and boost root growth',
  },
  {
    id: 'mulching',
    name: 'Mulching',
    price: 75,
    icon: '🪴',
    description: 'Refresh mulch in beds and around trees (up to 3 cubic yards)',
  },
]

// Quick lookup by id
export const ADDON_BY_ID: Record<string, Addon> = ADDON_CATALOG.reduce(
  (acc, a) => ({ ...acc, [a.id]: a }),
  {}
)

// Add-ons are only available as add-ons to a Lawn Mowing booking
// (not standalone services). If a customer wants only one of these,
// they should request a custom quote.
export const ADDONS_AVAILABLE_FOR: string[] = ['lawn_mowing']

export function isAddonAvailableFor(serviceType: string): boolean {
  return ADDONS_AVAILABLE_FOR.includes(serviceType)
}

// Sum the prices of the given add-on ids.
// `selectedAddons` is the JSONB value from the booking: array of {id, name, price, ...}
export function calculateAddonTotal(selectedAddons: any[] | null | undefined): number {
  if (!Array.isArray(selectedAddons)) return 0
  return selectedAddons.reduce((sum, a) => sum + (Number(a?.price) || 0), 0)
}

// Format selected addons for display: hydrate stored addons with current catalog
// (in case an addon's price changes after the booking was created).
export function hydrateAddons(stored: any[] | null | undefined): Addon[] {
  if (!Array.isArray(stored)) return []
  return stored
    .map((a) => ADDON_BY_ID[a?.id])
    .filter(Boolean) as Addon[]
}

// Platform's cut (20% of total — same as base).
export const PLATFORM_FEE_RATE = 0.20
// Pro's cut
export const PRO_PAYOUT_RATE = 0.80

export function calculateProPayout(totalPrice: number): number {
  return Math.round(totalPrice * PRO_PAYOUT_RATE * 100) / 100
}

export function calculatePlatformFee(totalPrice: number): number {
  return Math.round(totalPrice * PLATFORM_FEE_RATE * 100) / 100
}
