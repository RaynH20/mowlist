import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, MapPinned, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Address } from '../lib/database.types'

// Fix Leaflet default icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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

interface LocationPing {
  lat: number
  lng: number
  recorded_at: string
}

export default function LiveTrackingMap({
  bookingId,
  address,
  initialProLat,
  initialProLng,
  active,
  pollIntervalMs = 30000,
}: LiveTrackingMapProps) {
  const [ping, setPing] = useState<LocationPing | null>(
    initialProLat != null && initialProLng != null
      ? { lat: initialProLat, lng: initialProLng, recorded_at: new Date().toISOString() }
      : null
  )
  const [error, setError] = useState<string | null>(null)

  // Poll for latest ping
  useEffect(() => {
    if (!active) return

    const fetchLatest = async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('pro_location_pings')
          .select('lat, lng, recorded_at')
          .eq('booking_id', bookingId)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // PGRST116 = no rows (no pings yet — that's ok)
        // 404 / 42P01 = table doesn't exist (migration not run yet — also ok, just no map)
        const ignorableCodes = ['PGRST116', '42P01', 'PGRST205']
        if (fetchErr && !ignorableCodes.includes(fetchErr.code)) {
          throw fetchErr
        }

        if (data) {
          setPing({
            lat: data.lat,
            lng: data.lng,
            recorded_at: data.recorded_at,
          })
        }
      } catch (err: any) {
        // Silently fail — don't break the parent component
        console.warn('LiveTrackingMap: could not load location', err?.message)
      }
    }

    fetchLatest()
    const interval = setInterval(fetchLatest, pollIntervalMs)
    return () => clearInterval(interval)
  }, [bookingId, active, pollIntervalMs])

  // Get customer coordinates from address
  // In production, addresses would have lat/lng from geocoding.
  // For now, we use a fallback: default to a known center.
  // To make this work without geocoding, we'll just show the pro's pin
  // and the map will center on that.
  const customerCoords: [number, number] | null = (address as any)?.lat && (address as any)?.lng
    ? [(address as any).lat, (address as any).lng]
    : null
  const proCoords: [number, number] | null = ping ? [ping.lat, ping.lng] : null

  // Center on whichever we have
  const center: [number, number] = proCoords || customerCoords || [39.9526, -75.1652] // Philly default
  const zoom = proCoords ? 14 : 10

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
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Customer home */}
          {customerCoords && (
            <Marker position={customerCoords}>
              <Popup>
                <strong>Your home</strong>
                <br />
                {address?.street_1}
              </Popup>
            </Marker>
          )}

          {/* Pro's last known location */}
          {proCoords && (
            <>
              <CircleMarker
                center={proCoords}
                radius={20}
                pathOptions={{
                  color: '#22C55E',
                  fillColor: '#22C55E',
                  fillOpacity: 0.2,
                  weight: 2,
                }}
              />
              <Marker position={proCoords}>
                <Popup>
                  <strong>Your MowList pro</strong>
                  <br />
                  Last seen {new Date(ping!.recorded_at).toLocaleTimeString()}
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Overlay if no location yet */}
        {!proCoords && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Loader2 className="animate-spin mx-auto text-slate-400" size={24} />
              <p className="text-sm text-slate-500 mt-2">Waiting for pro's location...</p>
            </div>
          </div>
        )}
      </div>

      {ping && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPinned size={12} />
          <span>
            Last updated {new Date(ping.recorded_at).toLocaleTimeString()} ·{' '}
            {active ? 'Refreshing every 30s' : 'Tracking ended'}
          </span>
        </div>
      )}
    </div>
  )
}
