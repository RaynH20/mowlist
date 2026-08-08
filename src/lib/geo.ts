// ============================================
// MowList Geo Math
// ============================================
// Pure helpers for working with GPS coordinates on a sphere (Earth).
// Haversine gives great-circle distance between two lat/lng points in meters.

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Great-circle distance between two GPS points, in meters.
 * Returns NaN if either input is invalid.
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !isFinite(lat1) || !isFinite(lng1) ||
    !isFinite(lat2) || !isFinite(lng2)
  ) {
    return NaN
  }
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

/** Same as haversineDistanceMeters, but returns miles. */
export function haversineDistanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return haversineDistanceMeters(lat1, lng1, lat2, lng2) / 1609.344
}

/**
 * Format a distance in a human-friendly way.
 * - <100m → "47 m"
 * - <1km → "0.3 mi"
 * - >=1km → "3.2 mi"
 */
export function formatDistance(meters: number): string {
  if (!isFinite(meters)) return '?'
  if (meters < 1000) return `${Math.round(meters)} m`
  const miles = meters / 1609.344
  if (miles < 0.1) return `${Math.round(meters)} m`
  return `${miles.toFixed(1)} mi`
}

// Geofence threshold for "is the pro at the job site?"
// ~500m is roughly the longest residential lot + a small buffer for GPS noise.
// Tuned to allow: pro in their truck at the curb, GPS accuracy ~50m.
// Tuned to block: pro at a McDonald's 3 miles away.
export const GEOFENCE_MAX_METERS = 500

// How old can a location ping be and still count as "the pro is here"?
// 5 min. Long enough that we don't need to ping every second, short enough
// that the pro can't finish a job, drive home, then mark complete.
export const PING_MAX_AGE_MS = 5 * 60 * 1000

export type GeofenceResult =
  | { ok: true; distanceMeters: number }
  | { ok: false; reason: 'no_ping' | 'stale_ping' | 'too_far' | 'unparseable'; distanceMeters: number | null; message: string }

export interface GeofenceInput {
  /** Customer address coordinates (where the pro SHOULD be) */
  customerLat: number
  customerLng: number
  /** Last pro ping (where the pro ACTUALLY is) */
  proLat: number | null | undefined
  proLng: number | null | undefined
  /** When the pro's last ping happened (ISO string or null) */
  proPingedAt: string | null | undefined
  /** GPS accuracy in meters (optional, used to widen the fence) */
  proAccuracyMeters?: number | null
}

/**
 * Decide whether the pro is at the customer's address.
 * Used before letting them mark a booking as 'completed'.
 */
export function checkGeofence(input: GeofenceInput): GeofenceResult {
  const { customerLat, customerLng, proLat, proLng, proPingedAt, proAccuracyMeters } = input

  // No ping at all
  if (proLat == null || proLng == null || !proPingedAt) {
    return {
      ok: false,
      reason: 'no_ping',
      distanceMeters: null,
      message: 'We need your location to confirm you\'re at the job site. Turn on location services and try again.',
    }
  }

  // Stale ping
  const pingAge = Date.now() - new Date(proPingedAt).getTime()
  if (pingAge > PING_MAX_AGE_MS) {
    return {
      ok: false,
      reason: 'stale_ping',
      distanceMeters: null,
      message: 'Your last location update was more than 5 minutes ago. Refresh the page so we can verify your location.',
    }
  }

  // Compute distance
  const distance = haversineDistanceMeters(customerLat, customerLng, proLat, proLng)
  if (!isFinite(distance)) {
    return {
      ok: false,
      reason: 'unparseable',
      distanceMeters: null,
      message: 'We couldn\'t determine your distance from the job site. Please refresh and try again.',
    }
  }

  // Widen the fence a little if the GPS is noisy (accuracy > 100m)
  const threshold = GEOFENCE_MAX_METERS + (proAccuracyMeters && proAccuracyMeters > 100 ? proAccuracyMeters : 0)

  if (distance > threshold) {
    return {
      ok: false,
      reason: 'too_far',
      distanceMeters: distance,
      message: `You appear to be ${formatDistance(distance)} from the job site. You need to be at the address (within ${formatDistance(threshold)}) to mark the job complete.`,
    }
  }

  return { ok: true, distanceMeters: distance }
}
