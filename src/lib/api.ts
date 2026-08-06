import { supabase, stripePublishableKey } from './supabase'
import type {
  Address,
  Booking,
  BookingRequest,
  QuoteRequest,
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

// ============ QUOTE REQUESTS ============

export async function createQuoteRequest(request: Partial<QuoteRequest>): Promise<{ data: QuoteRequest | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .insert(request)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

export async function getCustomerQuoteRequests(customerId: string): Promise<{ data: QuoteRequest[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function getPendingQuoteRequests(): Promise<{ data: QuoteRequest[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('status', 'submitted')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function updateQuoteRequest(id: string, updates: Partial<QuoteRequest>): Promise<{ data: QuoteRequest | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('quote_requests')
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

export async function getCustomerBookings(customerId: string): Promise<{ data: Booking[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
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
  file: File
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
        photo_type: photoType,
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

    // For now, get all bookings that don't have a provider assigned
    // In production, this would filter by location
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', null)
      .eq('booking_status', 'booked')
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
      .eq('provider_id', profile.id)

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
    pendingQuotes: number
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

    // Pending quote requests
    const { count: pendingQuotes } = await supabase
      .from('quote_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')

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
        pendingQuotes: pendingQuotes || 0,
        totalRevenue,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: {
        totalBookings: 0,
        activeProviders: 0,
        pendingQuotes: 0,
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
