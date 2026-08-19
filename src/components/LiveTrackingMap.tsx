import { useEffect, useState } from 'react'
// Map disabled — react-leaflet 5.x requires React 19, we're on 18.
// Re-enable when the dep is upgraded. The component still renders a
// clean placeholder so the live tracking UI is useful.
import { Loader2, MapPinned, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Address } from '../lib/database.types'

interface LiveTrackingMapProps {
  bookingId: string
  /** Customer's address (for the home marker) */
  address: Address | null
  /** Initial pro position (from booking.pro_lat/pro_lng) */
  initialProLat?: number | null
  initialProLng?: number | null
  /** Whether to auto-refresh (only when booking is in active state) */
  active: boolean
  /** Poll interval in ms (default 30s) */
  pollIntervalMs?: number
}

interface ProPing {
  id: string
  booking_id: string
  lat: number
  lng: number
  accuracy_meters: number | null
  recorded_at: string
}

/**
 * Live tracking component for the customer dashboard. Shows the pro's
 * location in real time during an active job.
 *
 * NOTE: The Leaflet map was disabled because react-leaflet 5.x requires
 * React 19 and we're on 18. This component now renders a clean
 * placeholder with the latest known position + timestamp. To re-enable
 * the real map: `pnpm add react-leaflet@4.2.1` and re-add the imports.
 */
export default function LiveTrackingMap({
  bookingId,
  address,
  initialProLat,
  initialProLng,
  active,
  pollIntervalMs = 30000,
}: LiveTrackingMapProps) {
  const [ping, setPing] = useState<ProPing | null>(
    initialProLat != null && initialProLng != null
      ? {
          id: 'initial',
          booking_id: bookingId,
          lat: initialProLat,
          lng: initialProLng,
          accuracy_meters: null,
          recorded_at: new Date().toISOString(),
        }
      : null
  )
  const [error, setError] = useState<string | null>(null)
  const [lastFetchAt, setLastFetchAt] = useState<Date | null>(null)

  // Fetch latest ping from booking_photos / pro_location_pings.
  useEffect(() => {
    if (!active) return
    let cancelled = false

    const fetchLatest = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('pro_location_pings')
          .select('*')
          .eq('booking_id', bookingId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (fetchErr) {
          setError(fetchErr.message)
          return
        }
        if (data) setPing(data as ProPing)
        setLastFetchAt(new Date())
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to fetch location')
      }
    }

    fetchLatest()
    const id = setInterval(fetchLatest, pollIntervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [bookingId, active, pollIntervalMs])

  const proCoords: [number, number] | null =
    ping ? [ping.lat, ping.lng] : null
  const customerCoords: [number, number] | null =
    address?.latitude && address?.longitude
      ? [address.latitude, address.longitude]
      : null

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-2">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-medium text-amber-900">Map temporarily unavailable</p>
          <p className="text-xs text-amber-700 mt-0.5">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        {/* Map disabled — react-leaflet 5.x needs React 19, we're on 18.
            Show a clean placeholder so the live tracking UI is still useful. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <MapPinned size={36} className="text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">Live tracking map</p>
          <p className="text-xs text-slate-400 mt-1 px-4 text-center">
            {proCoords
              ? `Pro is on the way · last updated ${new Date(ping!.recorded_at).toLocaleTimeString()}`
              : 'Waiting for pro to share their location'}
          </p>
        </div>
      </div>

      {ping && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPinned size={12} />
          <span>
            Last updated {new Date(ping.recorded_at).toLocaleTimeString()} ·{' '}
            {lastFetchAt && `refreshed ${lastFetchAt.toLocaleTimeString()}`}
          </span>
        </div>
      )}

      {!ping && !error && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 size={12} className="animate-spin" />
          <span>Waiting for the pro to share their location…</span>
        </div>
      )}
    </div>
  )
}
