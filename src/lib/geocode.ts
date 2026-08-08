// ============================================
// MowList Geocoding
// ============================================
// Turn a street address into GPS coordinates (lat, lng).
// Uses Nominatim (OpenStreetMap) — free, no API key, just slow (1 req/sec).
//
// In production we'd swap this for Mapbox or Google Geocoding for better
// accuracy + faster responses, but for v1 Nominatim is perfect.

export interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress?: string
  source: 'nominatim'
}

/**
 * Geocode a US street address to lat/lng.
 * Returns null on failure (don't break the booking flow if geocoding fails).
 */
export async function geocodeAddress(
  street: string,
  city: string,
  state: string,
  zipCode: string
): Promise<GeocodeResult | null> {
  // Compose the query — Nominatim prefers a single line
  const query = [street, city, state, zipCode, 'USA']
    .filter(Boolean)
    .map((s) => s.trim())
    .join(', ')

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'us')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requires a User-Agent (they block default ones)
        'User-Agent': 'MowList/1.0 (https://mowlist.com)',
        'Accept': 'application/json',
      },
    })

    if (!res.ok) {
      console.warn(`Nominatim returned ${res.status} for "${query}"`)
      return null
    }

    const results = await res.json()
    if (!Array.isArray(results) || results.length === 0) {
      console.warn(`Nominatim found no results for "${query}"`)
      return null
    }

    const top = results[0]
    const lat = parseFloat(top.lat)
    const lng = parseFloat(top.lon)
    if (!isFinite(lat) || !isFinite(lng)) return null

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: top.display_name,
      source: 'nominatim',
    }
  } catch (err) {
    console.warn('Geocoding failed:', err)
    return null
  }
}

/**
 * Build a short delay helper so we don't hammer Nominatim (>1 req/sec).
 * Currently callers invoke this sparingly (1 per address creation) so we don't
 * need it, but here for future batch geocoding.
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
