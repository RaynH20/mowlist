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
    // Update booking status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ booking_status: status, updated_at: new Date().toISOString() })
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
      .single()

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
    // Get provider profile ID
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', profile.id)
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
    // Get provider profile
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      throw new Error('Provider profile not found')
    }

    // Update booking with provider
    const { data, error } = await supabase
      .from('bookings')
      .update({
        provider_id: profile.id,
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
    // Get provider profile ID
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('service_areas')
      .select('*')
      .eq('provider_id', profile.id)
      .order('is_primary', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

export async function addServiceArea(providerId: string, area: Partial<ServiceArea>): Promise<{ data: ServiceArea | null; error: Error | null }> {
  try {
    // Get provider profile ID
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      throw new Error('Provider profile not found')
    }

    const { data, error } = await supabase
      .from('service_areas')
      .insert({ ...area, provider_id: profile.id })
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
    // Get provider profile
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      return { data: { total: 0, pending: 0, paid: 0 }, error: null }
    }

    // Get completed bookings with payouts
    const { data: bookings } = await supabase
      .from('bookings')
      .select('provider_payout_amount, booking_status')
      .eq('provider_id', profile.id)
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
    // Get provider profile
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      return { data: [], error: null }
    }

    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('provider_id', profile.id)
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
