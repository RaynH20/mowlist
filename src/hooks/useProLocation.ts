import { useEffect, useRef, useState, useCallback } from 'react'
import { pingProLocation } from '../lib/api'

interface UseProLocationOptions {
  /** Active booking ID — only pings when this is set */
  bookingId: string | null
  /** How often to ping (ms). Default 30s. */
  intervalMs?: number
  /** Whether to use navigator.geolocation.watchPosition (real-time) or just interval-based polling */
  watch?: boolean
}

interface UseProLocationReturn {
  /** Is the browser currently reporting the pro's position? */
  isTracking: boolean
  /** Has the pro granted location permission? */
  permissionGranted: boolean | null
  /** Last error from geolocation or ping */
  error: string | null
  /** The most recent position (browser coords) */
  lastPosition: GeolocationPosition | null
  /** Last successful ping to the server */
  lastPingAt: number | null
  /** Manually trigger a ping (e.g. before marking complete) */
  pingNow: () => Promise<void>
}

/**
 * Pro-side location tracker. Sends periodic pings to the server while a
 * booking is active. Used for:
 *   1. Customer live tracking map
 *   2. Geofence check before allowing the pro to mark complete
 *
 * Only sends pings when there's an active booking AND the booking is in an
 * "active service" state (the server also enforces this in pingProLocation).
 */
export function useProLocation({
  bookingId,
  intervalMs = 30_000,
  watch = true,
}: UseProLocationOptions): UseProLocationReturn {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastPosition, setLastPosition] = useState<GeolocationPosition | null>(null)
  const [lastPingAt, setLastPingAt] = useState<number | null>(null)

  const watchIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastPositionRef = useRef<GeolocationPosition | null>(null)
  const isPingingRef = useRef(false)

  // Keep ref in sync with state for the closure inside watch callbacks
  useEffect(() => {
    lastPositionRef.current = lastPosition
  }, [lastPosition])

  const pingNow = useCallback(async () => {
    if (!bookingId || !lastPositionRef.current || isPingingRef.current) return
    isPingingRef.current = true
    try {
      const { latitude, longitude } = lastPositionRef.current.coords
      const { error: pingErr } = await pingProLocation(
        bookingId,
        latitude,
        longitude,
        lastPositionRef.current.coords.accuracy
      )
      if (pingErr) {
        // Silently log — the customer just won't see live tracking
        console.warn('Pro location ping failed:', pingErr.message)
      } else {
        setLastPingAt(Date.now())
      }
    } finally {
      isPingingRef.current = false
    }
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) {
      // No active booking — tear down
      setIsTracking(false)
      return
    }

    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location services.')
      setPermissionGranted(false)
      return
    }

    let cancelled = false

    // Check permission state
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (cancelled) return
          setPermissionGranted(result.state === 'granted')
        })
        .catch(() => {
          // Some browsers don't support permissions API for geolocation
          setPermissionGranted(null)
        })
    }

    const handlePosition = (pos: GeolocationPosition) => {
      if (cancelled) return
      setLastPosition(pos)
      setIsTracking(true)
      setError(null)
    }

    const handleError = (err: GeolocationPositionError) => {
      if (cancelled) return
      if (err.code === err.PERMISSION_DENIED) {
        setError('Location permission denied. Please enable it to mark jobs complete.')
        setPermissionGranted(false)
        setIsTracking(false)
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError('Location is currently unavailable. We\'ll keep trying.')
      } else if (err.code === err.TIMEOUT) {
        setError('Location request timed out. We\'ll keep trying.')
      } else {
        setError('Location error: ' + err.message)
      }
    }

    if (watch) {
      // Real-time: watchPosition fires whenever the device moves
      watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 30_000,
      })
    } else {
      // Polling: getCurrentPosition at intervals
      const tick = () => {
        if (cancelled) return
        navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
          enableHighAccuracy: true,
          maximumAge: 5_000,
          timeout: 15_000,
        })
      }
      tick()
      intervalIdRef.current = setInterval(tick, intervalMs)
    }

    return () => {
      cancelled = true
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (intervalIdRef.current != null) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [bookingId, intervalMs, watch])

  // Send pings to the server on an interval (regardless of watch vs. poll)
  useEffect(() => {
    if (!bookingId) return
    if (!lastPosition) return
    // Ping immediately when we get a position
    pingNow()
    // Then every intervalMs
    const id = setInterval(pingNow, intervalMs)
    return () => clearInterval(id)
  }, [bookingId, lastPosition, intervalMs, pingNow])

  return { isTracking, permissionGranted, error, lastPosition, lastPingAt, pingNow }
}
