// Shared display labels for database values.
// Keeps "lawn_mowing" → "Lawn Mowing", "standard" → "Medium Yard", etc.
// consistent across every page so the UI never shows raw enum values.

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  lawn_mowing: 'Lawn Mowing',
  edging: 'Edging',
  hedge_trimming: 'Hedge Trimming',
  leaf_removal: 'Leaf Removal',
  fertilization: 'Fertilization',
  aeration: 'Lawn Aeration',
  weed_control: 'Weed Control',
}

export const YARD_SIZE_LABELS: Record<string, string> = {
  small: 'Small Yard',
  standard: 'Medium Yard',
  medium: 'Medium Yard',
  large: 'Large Yard',
  custom: 'Custom Quote',
  custom_quote: 'Custom Quote',
}

export const SERVICE_FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

export function serviceTypeLabel(value: string | null | undefined): string {
  if (!value) return 'Lawn Care'
  return SERVICE_TYPE_LABELS[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function yardSizeLabel(value: string | null | undefined): string {
  if (!value) return 'Yard'
  return YARD_SIZE_LABELS[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function serviceFrequencyLabel(value: string | null | undefined): string {
  if (!value) return ''
  return SERVICE_FREQUENCY_LABELS[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: 'Awaiting Pro',
  booked: 'Booked',
  provider_assigned: 'Confirmed',
  on_the_way: 'On the way',
  arrived: 'On site',
  in_progress: 'Mowing',
  mowing: 'Mowing',
  pending_review: 'Awaiting review',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  refunded: 'Refunded',
}

export function formatBookingStatus(value: string | null | undefined): string {
  if (!value) return ''
  return BOOKING_STATUS_LABELS[value] || value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
