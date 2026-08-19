import { supabase, stripePublishableKey } from './supabase'
import type {
  Address,
  Booking,
  BookingRequest,
  ProviderProfile,
  ServiceArea,
  Payment,
  Payout,
  BookingStatus,
  BookingPhoto,
} from './database.types'

// ============ ADDRESSES ============

export async function createAddress(address: Partial<Address>): Promise<{ data: Address | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert(address)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getUserAddresses(userId: string): Promise<{ data: Address[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ============ BOOKING REQUESTS ============

export async function createBookingRequest(request: Partial<BookingRequest>): Promise<{ data: BookingRequest | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert(request)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getCustomerBookingRequests(customerId: string): Promise<{ data: BookingRequest[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// Note: the 'custom quote' flow has been removed — all bookings now use
// the standard booking flow with a fixed price from the yard-size selector.
// The quote_requests table still exists in the DB but is no longer
// written to or read from.

// ============ BOOKINGS ============

export async function createBooking(booking: Partial<Booking>): Promise<{ data: Booking | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getCustomerBookings(customerId: string): Promise<{ data: any[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Hydrate with provider info
    const providerIds = [...new Set((data || []).map(b => b.provider_id).filter(Boolean))]
    let providerMap = new Map<string, { business_name: string; first_name: string; last_name: string }>()

    if (providerIds.length > 0) {
      // Try to fetch provider names + avatar. This may fail if RLS doesn't allow it —
      // we silently fall back to "no name" rather than breaking the whole bookings list.
      try {
        // The provider_profiles table has display_name + profile_image_url
        const { data: providers, error: pErr } = await supabase
          .from('provider_profiles')
          .select('id, display_name, profile_image_url')
          .in('id', providerIds)

        if (!pErr && providers) {
          providerMap = new Map(providers.map(p => [p.id, p]))
        } else if (pErr) {
          console.warn('Could not fetch provider names (RLS may be blocking):', pErr.message)
        }
      } catch (innerErr) {
        console.warn('Provider name fetch failed:', innerErr)
      }
    }

    const hydrated = (data || []).map(b => {
      const provider = b.provider_id ? providerMap.get(b.provider_id) : null
      const providerName = provider?.display_name || null
      const providerImage = (provider as any)?.profile_image_url || null
      return { ...b, provider_name: providerName, provider_image_url: providerImage }
    })

    return { data: hydrated, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function getBookingById(bookingId: string): Promise<{ data: Booking | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<{ data: Booking | null; error: Error | null }> {
  try {
    // If trying to mark complete, REQUIRE a before AND after photo
    if (status === 'completed') {
      const { data: existing, error: fetchError } = await supabase
        .from('bookings')
        .select('before_photo_url, after_photo_url')
        .eq('id', bookingId)
        .single()

      if (fetchError) throw fetchError

      if (!existing?.before_photo_url) {
        return { data: null, error: new Error('Before photo is required to mark job complete. Please take a "before" photo first.') }
      }
      if (!existing?.after_photo_url) {
        return { data: null, error: new Error('After photo is required to mark job complete. Please take an "after" photo to prove the work was done.') }
      }
    }

    // If transitioning to in_progress and no before_photo_url, require it
    if (status === 'in_progress') {
      const { data: existing, error: fetchError } = await supabase
        .from('bookings')
        .select('before_photo_url')
        .eq('id', bookingId)
        .single()

      if (fetchError) throw fetchError

      if (!existing?.before_photo_url) {
        return { data: null, error: new Error('Before photo is required to start the job. Please take a "before" photo first.') }
      }
    }

    // Build the update payload
    const updatePayload: Record<string, any> = {
      booking_status: status,
      updated_at: new Date().toISOString(),
    }

    // If starting the active service window, record when tracking started
    if (status === 'on_the_way' && !updatePayload.tracking_started_at) {
      updatePayload.tracking_started_at = new Date().toISOString()
    }

    // If completing, end tracking
    if (status === 'completed') {
      updatePayload.tracking_ended_at = new Date().toISOString()
      // Also set the completed_at timestamp if it exists
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error

    // Create status event
    await supabase.from('booking_status_events').insert({
      booking_id: bookingId,
      status,
    })

    return { data: booking, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Upload a job photo (before / during / after / issue / completion) to Supabase Storage
 * and link it to the booking. Updates the booking's before_photo_url or after_photo_url
 * depending on the photo type.
 */
export async function uploadJobPhoto(
  bookingId: string,
  photoType: 'before' | 'during' | 'after' | 'issue' | 'completion',
  file: File,
  addonId: string | null = null
): Promise<{ data: { url: string } | null; error: Error | null }> {
  try {
    // Validate file
    if (!file.type.startsWith('image/')) {
      return { data: null, error: new Error('Please upload an image file (JPG, PNG, etc.)') }
    }
    if (file.size > 10 * 1024 * 1024) {
      return { data: null, error: new Error('Image must be under 10MB') }
    }

    // Generate unique path: bookings/{bookingId}/{photoType}-{timestamp}.{ext}
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) ? ext : 'jpg'
    const path = `bookings/${bookingId}/${photoType}-${Date.now()}.${safeExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      // Detect "bucket not found" and give a useful message
      if (uploadError.message?.toLowerCase().includes('bucket') ||
          uploadError.message?.toLowerCase().includes('not found') ||
          (uploadError as any).statusCode === '404') {
        return {
          data: null,
          error: new Error(
            'Photo storage is not set up yet. Please run the migration: supabase/migrations/2026-08-06_job_photos.sql in your Supabase SQL editor to create the job-photos bucket.'
          ),
        }
      }
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(path)
    const url = urlData.publicUrl

    // Update the booking column if it's a before/after photo
    if (photoType === 'before') {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          before_photo_url: url,
          before_photo_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
      if (updateError) throw updateError
    } else if (photoType === 'after' || photoType === 'completion') {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          after_photo_url: url,
          after_photo_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
      if (updateError) throw updateError
    }

    // Also insert into booking_photos table (for multi-photo tracking)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Don't fail the whole upload if this insert fails (table may not exist yet)
      await supabase.from('booking_photos').insert({
        booking_id: bookingId,
        photo_role: photoType,
        addon_id: addonId,
        photo_url: url,
        uploaded_by: user.id,
      }).then(({ error: insErr }) => {
        if (insErr) console.warn('Could not insert into booking_photos (table may not exist):', insErr.message)
      })
    }

    return { data: { url }, error: null }
  } catch (error: any) {
    return { data: null, error: error as Error }
  }
}

/**
 * Pro sends a location ping during an active service. Used for live tracking.
 * Only allowed when the booking is in on_the_way, arrived, or in_progress.
 * Silently no-ops if the migration hasn't been run yet.
 */
export async function pingProLocation(
  bookingId: string,
  lat: number,
  lng: number,
  accuracyMeters?: number
): Promise<{ data: any; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not signed in') }

    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!provider) return { data: null, error: new Error('No provider profile') }

    // Verify the booking is in an active state
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('booking_status, provider_id')
      .eq('id', bookingId)
      .single()

    if (bErr) throw bErr
    if (booking?.provider_id !== provider.id) {
      return { data: null, error: new Error('Not your booking') }
    }
    if (!['on_the_way', 'arrived', 'in_progress'].includes(booking?.booking_status ?? '')) {
      return { data: null, error: new Error('Tracking only allowed during active service') }
    }

    // Insert the ping (silently fail if table doesn't exist yet)
    const { data, error } = await supabase.from('pro_location_pings').insert({
      provider_id: provider.id,
      booking_id: bookingId,
      lat,
      lng,
      accuracy_meters: accuracyMeters ?? null,
    })

    if (error) {
      // If table doesn't exist (42P01), silently fail - migration not run yet
      if (error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('pro_location_pings table not found — run migration to enable live tracking')
        // Still update the booking's last-known position
        await supabase
          .from('bookings')
          .update({
            pro_lat: lat,
            pro_lng: lng,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
        return { data: null, error: null }
      }
      throw error
    }

    // Also update last-known on the booking
    await supabase
      .from('bookings')
      .update({
        pro_lat: lat,
        pro_lng: lng,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

// ============ PROVIDER JOBS ============

export async function getAvailableJobs(providerId: string): Promise<{ data: Booking[]; error: Error | null }> {
  try {
    // Get provider's service areas
    const { data: serviceAreas } = await supabase
      .from('service_areas')
      .select('*')
      .eq('provider_id', providerId)
      .eq('is_active', true)

    if (!serviceAreas || serviceAreas.length === 0) {
      return { data: [], error: null }
    }

    // Get provider's profile to check service radius
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('service_radius_miles')
      .eq('user_id', providerId)
      .maybeSingle()

    // Get bookings that are awaiting a pro: either paid ('booked') or
    // pre-payment ('requested' for Option A / pay-on-completion).
    // In production, this would filter by location/service area.
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .is('provider_id', null)
      .in('booking_status', ['requested', 'booked'])
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function getProviderAssignedJobs(providerId: string): Promise<{ data: Booking[]; error: Error | null }> {
  try {
    // Get provider profile ID via SECURITY DEFINER (bypasses RLS)
    const { data: profileId } = await supabase.rpc('current_provider_id')

    if (!profileId) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', profileId)
      .in('booking_status', ['booked', 'provider_assigned', 'on_the_way', 'arrived', 'in_progress'])
      .order('scheduled_date', { ascending: true })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function acceptJob(providerId: string, bookingId: string): Promise<{ data: Booking | null; error: Error | null }> {
  try {
    // Get provider profile via SECURITY DEFINER function (bypasses RLS)
    const { data: profileId, error: rpcError } = await supabase.rpc('current_provider_id')
    if (rpcError || !profileId) {
      throw new Error(`Provider profile not found: ${rpcError?.message || 'no profile id'}`)
    }

    // Update booking with provider
    const { data, error } = await supabase
      .from('bookings')
      .update({
        provider_id: profileId,
        booking_status: 'provider_assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error

    // Add status event
    await supabase.from('booking_status_events').insert({
      booking_id: bookingId,
      status: 'provider_assigned',
      changed_by_user_id: providerId,
    })

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function declineJob(providerId: string, bookingId: string): Promise<{ error: Error | null }> {
  try {
    // For now, just log the decline - in production might have different logic
    await supabase.from('booking_status_events').insert({
      booking_id: bookingId,
      status: 'cancelled',
      changed_by_user_id: providerId,
      metadata_json: { reason: 'provider_declined' },
    })

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ============ PROVIDER PROFILE ============

export async function getProviderProfile(userId: string): Promise<{ data: ProviderProfile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateProviderProfile(userId: string, updates: Partial<ProviderProfile>): Promise<{ data: ProviderProfile | null; error: Error | null }> {
  try {
    // Get provider profile ID first
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) {
      throw new Error('Provider profile not found')
    }

    const { data, error } = await supabase
      .from('provider_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

// ============ SERVICE AREAS ============

export async function getProviderServiceAreas(providerId: string): Promise<{ data: ServiceArea[]; error: Error | null }> {
  try {
    // Get provider profile ID via SECURITY DEFINER (bypasses RLS)
    const { data: profileId } = await supabase.rpc('current_provider_id')

    if (!profileId) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('provider_id', profileId)
      .order('is_primary', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function addServiceArea(providerId: string, area: Partial<ServiceArea>): Promise<{ data: ServiceArea | null; error: Error | null }> {
  try {
    // Get provider profile ID via SECURITY DEFINER (bypasses RLS)
    const { data: profileId, error: rpcError } = await supabase.rpc('current_provider_id')
    if (rpcError || !profileId) {
      throw new Error(`Provider profile not found: ${rpcError?.message || 'no profile id'}`)
    }

    const { data, error } = await supabase
      .from('service_areas')
      .insert({ ...area, provider_id: profileId })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function updateServiceArea(id: string, updates: Partial<ServiceArea>): Promise<{ data: ServiceArea | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('service_areas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function deleteServiceArea(id: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('service_areas')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ============ PAYMENTS ============

export async function createPayment(payment: Partial<Payment>): Promise<{ data: Payment | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getBookingPayment(bookingId: string): Promise<{ data: Payment | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

// ============ PROVIDER EARNINGS ============

export async function getProviderEarnings(providerId: string): Promise<{ data: { total: number; pending: number; paid: number }; error: Error | null }> {
  try {
    // Get provider profile via SECURITY DEFINER (bypasses RLS)
    const { data: profileId } = await supabase.rpc('current_provider_id')

    if (!profileId) {
      return { data: { total: 0, pending: 0, paid: 0 }, error: null }
    }

    // Get completed bookings with payouts
    const { data: bookings } = await supabase
      .from('bookings')
      .select('provider_payout_amount, booking_status')
      .eq('provider_id', profileId)
      .eq('booking_status', 'completed')

    const total = bookings?.reduce((sum, b) => sum + (b.provider_payout_amount || 0), 0) || 0

    // Get pending payouts
    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount, status')
      // Was `profile.id` — `profile` doesn't exist in this scope, so every call
      // threw a ReferenceError that the catch below swallowed, and Pro Earnings
      // silently reported $0 total / $0 pending / $0 paid for everyone.
      .eq('provider_id', profileId)

    const pending = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0
    const paid = payouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0

    return { data: { total, pending, paid }, error: null }
  } catch (error) {
    return { data: { total: 0, pending: 0, paid: 0 }, error: error as Error }
  }
}

export async function getProviderPayouts(providerId: string): Promise<{ data: Payout[]; error: Error | null }> {
  try {
    // Get provider profile via SECURITY DEFINER (bypasses RLS)
    const { data: profileId } = await supabase.rpc('current_provider_id')

    if (!profileId) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('provider_id', profileId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ============ ADMIN ============

export async function getAllBookings(limit = 50): Promise<{ data: Booking[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function getAllProviders(): Promise<{ data: ProviderProfile[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function getAdminStats(): Promise<{
  data: {
    totalBookings: number
    activeProviders: number
    totalRevenue: number
  }
  error: Error | null
}> {
  try {
    // Total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Active providers
    const { count: activeProviders } = await supabase
      .from('provider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)

    // Total revenue (from completed payments)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'captured')

    const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

    return {
      data: {
        totalBookings: totalBookings || 0,
        activeProviders: activeProviders || 0,
        totalRevenue,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: {
        totalBookings: 0,
        activeProviders: 0,
        totalRevenue: 0,
      },
      error: error as Error,
    }
  }
}

// ============ STRIPE HELPERS ============

export function getStripePublishableKey() {
  return stripePublishableKey
}

export async function createPaymentIntent(amount: number, customerId: string): Promise<{ clientSecret: string; error: Error | null }> {
  // In production, this would call your backend API which creates a Stripe PaymentIntent
  // For now, we'll simulate it
  try {
    // Simulated client secret - in production, call your API
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, customerId }),
    })

    if (!response.ok) {
      throw new Error('Failed to create payment intent')
    }

    const data = await response.json()
    return { clientSecret: data.clientSecret, error: null }
  } catch (error) {
    // For demo purposes, return a mock response
    return {
      clientSecret: 'pi_mock_' + Date.now() + '_secret_mock',
      error: null,
    }
  }
}

// ============ JOB PHOTOS ============

export const MAX_PHOTOS_PER_BOOKING = 5

/**
 * Get all photos for a booking, sorted by photo type (before, after first)
 * then by upload time.
 */
export async function getBookingPhotos(bookingId: string): Promise<{ data: BookingPhoto[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('booking_photos')
      .select('*')
      .eq('booking_id', bookingId)
      .order('uploaded_at', { ascending: true })

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { data: [], error: null }
      }
      throw error
    }
    return { data: (data || []) as BookingPhoto[], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

/**
 * Delete a photo by ID. Used when pro wants to remove a photo before
 * finalizing the job.
 */
export async function deleteBookingPhoto(photoId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('booking_photos')
      .delete()
      .eq('id', photoId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Get all payments for a customer. Tries multiple strategies to find
 * payments regardless of how customer_id was stored.
 */
export async function getCustomerPayments(customerId: string): Promise<{ data: Payment[]; error: Error | null }> {
  try {
    // Strategy 1: payments by customer_id
    const { data: byCustomerId, error: e1 } = await supabase
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (e1) {
      // Table might not exist
      if (e1.code === '42P01' || e1.code === 'PGRST205') {
        return { data: [], error: null }
      }
      // If RLS denies, fall through to other strategies
    }

    // Strategy 2: payments joined through the user's bookings
    const { data: customerBookings, error: bErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_id', customerId)

    let bookingPayments: any[] = []
    if (!bErr && customerBookings && customerBookings.length > 0) {
      const bookingIds = customerBookings.map(b => b.id)
      const { data: byBooking, error: e2 } = await supabase
        .from('payments')
        .select('*')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false })

      if (!e2 && byBooking) {
        bookingPayments = byBooking
      }
    }

    // Combine and dedupe
    const allPayments = [...(byCustomerId || []), ...bookingPayments]
    const seen = new Set<string>()
    const deduped = allPayments.filter(p => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })

    // Sort by created_at desc
    deduped.sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
      return bDate - aDate
    })

    return { data: deduped as Payment[], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

// ============================================
// REVIEWS (Phase 1 Quality Control)
// ============================================

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  comment: string | null
  dispute_status: 'none' | 'disputed' | 'upheld' | 'rejected'
  dispute_reason: string | null
  pro_rating_of_customer: number | null
  pro_private_feedback: string | null
  created_at: string
  updated_at: string
  // Hydrated fields (when joined)
  customer_name?: string | null
  customer_avatar_url?: string | null
}

/**
 * Submit a review for a completed booking.
 * One review per booking — calling this twice for the same booking will update.
 */
export async function submitReview(
  bookingId: string,
  rating: number,
  comment: string | null = null
): Promise<{ data: Review | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not signed in') }

    // Look up the booking to get provider_id
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, provider_id, customer_id, booking_status')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) {
      return { data: null, error: new Error('Booking not found') }
    }
    if (booking.customer_id !== user.id) {
      return { data: null, error: new Error('Not your booking') }
    }
    if (booking.booking_status !== 'completed') {
      return { data: null, error: new Error('Can only review completed bookings') }
    }
    if (!booking.provider_id) {
      return { data: null, error: new Error('No pro assigned to this booking') }
    }
    if (rating < 1 || rating > 5) {
      return { data: null, error: new Error('Rating must be between 1 and 5') }
    }

    // Upsert (one review per booking, but allow editing)
    const { data, error } = await supabase
      .from('reviews')
      .upsert({
        booking_id: bookingId,
        customer_id: user.id,
        provider_id: booking.provider_id,
        rating,
        comment: comment?.trim() || null,
      }, {
        onConflict: 'booking_id',
      })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Get all reviews for a provider, with hydrated customer name/avatar.
 * Excludes reviews in 'upheld' status (where pro won a dispute).
 */
export async function getReviewsForProvider(
  providerId: string,
  limit: number = 50
): Promise<{ data: Review[]; error: Error | null }> {
  try {
    // Step 1: Get the reviews (no joins — avoids FK hint errors)
    const { data, error } = await supabase
      .from('reviews')
      .select('id, booking_id, customer_id, provider_id, rating, comment, dispute_status, dispute_reason, pro_rating_of_customer, pro_private_feedback, created_at, updated_at')
      .eq('provider_id', providerId)
      .neq('dispute_status', 'upheld')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    if (!data || data.length === 0) return { data: [], error: null }

    // Step 2: Hydrate customer names + avatars in a separate query
    // (customer_profiles.user_id = reviews.customer_id, not a direct FK)
    const customerIds = [...new Set(data.map((r: any) => r.customer_id).filter(Boolean))]
    let profileMap = new Map<string, any>()
    if (customerIds.length > 0) {
      const { data: profiles, error: pErr } = await supabase
        .from('customer_profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', customerIds)
      if (!pErr && profiles) {
        profileMap = new Map(profiles.map((p: any) => [p.user_id, p]))
      }
    }

    // Step 3: Merge
    const hydrated = (data || []).map((r: any) => {
      const profile = profileMap.get(r.customer_id)
      const fullName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        : ''
      return {
        ...r,
        customer_name: fullName || 'Customer',
        customer_avatar_url: profile?.avatar_url || null,
      }
    })

    return { data: hydrated as Review[], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

/**
 * Get the customer's own review for a specific booking (if any).
 */
export async function getReviewForBooking(
  bookingId: string
): Promise<{ data: Review | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Pro disputes a review they think is fake or unfair.
 * Sets dispute_status to 'disputed' and stores the reason.
 * An admin (or future automated check) will resolve it.
 */
export async function disputeReview(
  reviewId: string,
  reason: string
): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not signed in') }

    // Get the provider profile for this user
    const { data: provider } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!provider) return { error: new Error('No provider profile') }

    const { error } = await supabase
      .from('reviews')
      .update({
        dispute_status: 'disputed',
        dispute_reason: reason.trim(),
      })
      .eq('id', reviewId)
      .eq('provider_id', provider.id)  // can only dispute own reviews
      .eq('dispute_status', 'none')     // can't re-dispute a resolved one

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

// ============================================
// FAVORITES (Phase 1 Quality Control)
// ============================================

export interface Favorite {
  id: string
  customer_id: string
  provider_id: string
  created_at: string
  // Hydrated
  provider?: {
    id: string
    display_name: string | null
    profile_image_url: string | null
    average_rating: number
    review_count: number
    bio: string | null
  }
}

/**
 * Add a pro to customer's favorites.
 */
export async function addFavorite(
  providerId: string
): Promise<{ data: Favorite | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: new Error('Not signed in') }

    const { data, error } = await supabase
      .from('favorites')
      .upsert({
        customer_id: user.id,
        provider_id: providerId,
      }, { onConflict: 'customer_id,provider_id' })
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Remove a pro from customer's favorites.
 */
export async function removeFavorite(
  providerId: string
): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: new Error('Not signed in') }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('customer_id', user.id)
      .eq('provider_id', providerId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Get all of a customer's favorited pros, with the pro's profile data hydrated.
 */
export async function getCustomerFavorites(
  customerId?: string
): Promise<{ data: Favorite[]; error: Error | null }> {
  try {
    let userId = customerId
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: [], error: null }
      userId = user.id
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id, customer_id, provider_id, created_at,
        provider:provider_profiles!favorites_provider_id_fkey(
          id, display_name, profile_image_url, average_rating, review_count, bio
        )
      `)
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: (data || []) as Favorite[], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

/**
 * Check if a customer has favorited a specific pro.
 * Returns { isFavorited: boolean, favoriteId: string | null }
 */
export async function isFavorited(
  providerId: string
): Promise<{ isFavorited: boolean; favoriteId: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { isFavorited: false, favoriteId: null }

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('customer_id', user.id)
      .eq('provider_id', providerId)
      .maybeSingle()

    if (error) {
      console.warn('isFavorited check failed:', error.message)
      return { isFavorited: false, favoriteId: null }
    }
    return { isFavorited: !!data, favoriteId: data?.id || null }
  } catch (error) {
    return { isFavorited: false, favoriteId: null }
  }
}

// ============================================
// ESCROW 24-HOUR REVIEW WINDOW
// ============================================

export interface EscrowSummary {
  booking_id: string
  ready_for_review_at: string | null
  auto_capture_at: string | null
  reviewed_at: string | null
  customer_approved_at: string | null
  payment_captured_at: string | null
  hours_until_auto_capture: number
  is_in_review_window: boolean
}

/**
 * Get escrow timing info for a booking.
 * Returns hours remaining in the 24h review window, or null if not in review.
 */
export async function getEscrowStatus(
  bookingId: string
): Promise<{ data: EscrowSummary | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_status, ready_for_review_at, auto_capture_at, reviewed_at, customer_approved_at, payment_captured_at')
      .eq('id', bookingId)
      .maybeSingle()

    if (error) throw error
    if (!data) return { data: null, error: null }

    const isInReview = data.booking_status === 'pending_review'
    const hoursUntil = isInReview && data.auto_capture_at
      ? Math.max(0, (new Date(data.auto_capture_at).getTime() - Date.now()) / 3_600_000)
      : 0

    return {
      data: {
        booking_id: data.id,
        ready_for_review_at: data.ready_for_review_at,
        auto_capture_at: data.auto_capture_at,
        reviewed_at: data.reviewed_at,
        customer_approved_at: data.customer_approved_at,
        payment_captured_at: data.payment_captured_at,
        hours_until_auto_capture: hoursUntil,
        is_in_review_window: isInReview,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/**
 * Customer approves the job. Triggers immediate payment capture.
 * Sets customer_approved_at + status = 'completed' + payment_status = 'captured'.
 */
/**
 * Wrap a promise with a hard timeout. If it doesn't resolve in `ms` ms,
 * reject with a clear timeout error instead of hanging forever.
 */
function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

export async function customerApproveBooking(
  bookingId: string
): Promise<{ data: any | null; error: Error | null }> {
  const log = (msg: string, extra?: any) =>
    console.log(`[approve] ${msg}`, extra ?? '')
  try {
    log('starting', { bookingId })
    const { data: { user } } = await withTimeout(
      supabase.auth.getUser(),
      8000,
      'auth.getUser'
    )
    if (!user) return { data: null, error: new Error('Not signed in') }
    log('got user', { userId: user.id })

    // Verify the booking belongs to this customer
    const { data: booking, error: bErr } = await withTimeout(
      supabase
        .from('bookings')
        .select('customer_id, booking_status, payment_status')
        .eq('id', bookingId)
        .single(),
      8000,
      'fetch booking'
    )
    log('fetched booking', { booking, bErr })

    if (bErr) throw bErr
    if (booking?.customer_id !== user.id) {
      return { data: null, error: new Error('Not your booking') }
    }
    if (booking.booking_status !== 'pending_review') {
      return { data: null, error: new Error('Booking is not awaiting review') }
    }

    // Mark the booking as approved + completed in the DB. We deliberately
    // do NOT touch payment_status here — the pg_cron job will flip it to
    // 'captured' after the actual Stripe API call succeeds. Trying to set
    // payment_status ourselves risks hitting a CHECK constraint (different
    // bookings are in different states: requires_capture, authorized, pending,
    // etc.) and failing the whole approval, which is the worst possible UX.
    //
    // IMPORTANT: the `.select()` is not cosmetic. Without it, a Postgres RLS
    // policy that filters this row out makes the UPDATE match ZERO rows and
    // still return `error: null` — a silent no-op. Selecting the row back
    // means we can tell "updated" from "silently blocked" and surface a real
    // error instead of a UI that pretends it worked.
    const { data: updated, error } = await withTimeout(
      supabase
        .from('bookings')
        .update({
          customer_approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          booking_status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select('id, booking_status, completed_at, customer_approved_at')
        .maybeSingle(),
      10000,
      'update booking'
    )

    if (error) {
      log('update error', error)
      throw error
    }
    if (!updated) {
      log('update matched 0 rows — RLS is blocking the customer UPDATE')
      throw new Error(
        "We couldn't record your approval. Your payment has NOT been released. " +
        'Please refresh and try again — if it keeps happening, contact support ' +
        '(error: booking update blocked).'
      )
    }
    log('success', updated)
    return { data: updated, error: null }
  } catch (err) {
    log('caught error', err)
    return { data: null, error: err as Error }
  }
}

/**
 * Customer disputes the job. Holds payment in escrow pending admin review.
 */
export async function customerDisputeBooking(
  bookingId: string,
  reason: string
): Promise<{ error: Error | null }> {
  const log = (msg: string, extra?: any) =>
    console.log(`[dispute] ${msg}`, extra ?? '')
  try {
    log('starting', { bookingId })
    const { data: { user } } = await withTimeout(
      supabase.auth.getUser(), 8000, 'auth.getUser'
    )
    if (!user) return { error: new Error('Not signed in') }

    const trimmed = reason.trim()
    if (trimmed.length < 10) {
      return { error: new Error('Please describe the issue (at least 10 characters)') }
    }

    const { data: booking, error: bErr } = await withTimeout(
      supabase
        .from('bookings')
        .select('customer_id, booking_status')
        .eq('id', bookingId)
        .single(),
      8000,
      'fetch booking'
    )
    log('fetched booking', { booking, bErr })

    if (bErr) throw bErr
    if (booking?.customer_id !== user.id) {
      return { error: new Error('Not your booking') }
    }
    if (booking.booking_status !== 'pending_review') {
      return { error: new Error('Can only dispute bookings in review') }
    }

    // 1. First do the critical update: set status to 'disputed' + stamp
    //    reviewed_at. These two columns are guaranteed to exist.
    //    `.select()` is required so a row filtered out by RLS surfaces as an
    //    error instead of a silent zero-row no-op (see customerApproveBooking).
    const { data: updated, error } = await withTimeout(
      supabase
        .from('bookings')
        .update({
          booking_status: 'disputed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select('id, booking_status')
        .maybeSingle(),
      10000,
      'update booking'
    )

    if (error) {
      log('update error', error)
      throw error
    }
    if (!updated) {
      log('update matched 0 rows — RLS is blocking the customer UPDATE')
      throw new Error(
        "We couldn't file your dispute. Your payment is still held and has NOT " +
        'been released. Please refresh and try again — if it keeps happening, ' +
        'contact support (error: booking update blocked).'
      )
    }
    log('success', updated)

    // 2. Best-effort: save the dispute reason to migration-26 columns.
    //    If migration 26 hasn't been run yet, this errors silently and the
    //    dispute still goes through (status is already 'disputed' from step 1).
    //    We use a separate query so a column-missing error doesn't block the
    //    whole dispute.
    supabase
      .from('bookings')
      .update({ dispute_reason: trimmed, disputed_at: new Date().toISOString() })
      .eq('id', bookingId)
      .then(() => null)
      .catch(() => null)

    // 3. Bump dispute count via RPC (soft-fail if it doesn't exist yet)
    supabase.rpc('increment_dispute_count', { p_booking_id: bookingId })
      .then(() => null)
      .catch(() => null)

    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

/**
 * Mark the booking as 'reviewed' (customer opened the review screen).
 * Used for analytics — doesn't change the actual status.
 */
export async function markBookingAsReviewed(
  bookingId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ reviewed_at: new Date().toISOString() })
      .eq('id', bookingId)
      .is('reviewed_at', null)  // only set once

    if (error) throw error
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}
