import { supabase } from './supabase'

// ============ PRO DASHBOARD ENHANCED HELPERS ============
// These helpers fetch bookings with JOINED customer + address data
// so the Pro UI can show real names, addresses, etc.

export interface ProBookingWithDetails {
  id: string
  customer_id: string
  provider_id: string | null
  address_id: string
  service_type: string
  service_frequency: string
  yard_size_category: string
  scheduled_date: string
  scheduled_time_window: string | null
  estimated_price: number
  provider_payout_amount: number | null
  platform_fee_amount: number | null
  booking_status: string
  payment_status: string
  notes: string | null
  completed_at: string | null
  created_at: string
  // Joined data
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  customer_avatar_url: string | null
  address_line: string | null
  address_city: string | null
  address_state: string | null
  address_zip: string | null
  // Customer's address coordinates (geocoded). Used for the geofence check
  // when the pro marks a booking complete.
  address_latitude: number | null
  address_longitude: number | null
}

/**
 * Fetch all available (unassigned) bookings with joined customer/address data.
 * Returns jobs that any pro can accept.
 */
export async function getAvailableJobsWithDetails(): Promise<{
  data: ProBookingWithDetails[]
  error: Error | null
}> {
  try {
    // First, fetch all unassigned bookings waiting for a pro to accept.
    // Status 'requested' = waiting for a pro; 'booked' = already paid+confirmed
    // (no need to re-display those to the marketplace).
    const { data: bookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('*')
      .is('provider_id', null)
      .eq('booking_status', 'requested')
      .order('scheduled_date', { ascending: true })

    if (bookingsErr) throw bookingsErr
    if (!bookings || bookings.length === 0) {
      return { data: [], error: null }
    }

    // Collect IDs for batched lookups
    const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
    const addressIds = [...new Set(bookings.map(b => b.address_id).filter(Boolean))]

    // Fetch all customers' user + profile data in one go
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, phone')
      .in('id', customerIds)

    const userIds = usersData?.map(u => u.id) || []

    const { data: profilesData } = await supabase
      .from('customer_profiles')
      .select('user_id, first_name, last_name, avatar_url')
      .in('user_id', userIds)

    // Fetch all addresses in one go
    const { data: addressesData } = await supabase
      .from('addresses')
      .select('id, street_1, city, state, zip_code, latitude, longitude')
      .in('id', addressIds)

    // Build lookup maps
    const usersById = new Map((usersData || []).map(u => [u.id, u]))
    const profilesById = new Map((profilesData || []).map(p => [p.user_id, p]))
    const addressesById = new Map((addressesData || []).map(a => [a.id, a]))

    // Merge
    const result: ProBookingWithDetails[] = bookings.map(b => {
      const user = usersById.get(b.customer_id)
      const profile = user ? profilesById.get(user.id) : null
      const address = addressesById.get(b.address_id)
      return {
        ...b,
        customer_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
        customer_avatar_url: (profile as any)?.avatar_url || null,
        customer_email: user?.email || null,
        customer_phone: user?.phone || null,
        address_line: address?.street_1 || null,
        address_city: address?.city || null,
        address_state: address?.state || null,
        address_zip: address?.zip_code || null,
        // Geofence support: customer address coords
        address_latitude: address?.latitude ?? null,
        address_longitude: address?.longitude ?? null,
      }
    })

    return { data: result, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

/**
 * Fetch a single pro's assigned jobs with joined customer/address data.
 * Includes in-progress, scheduled, and recently-completed jobs.
 */
export async function getProAssignedJobsWithDetails(providerId: string): Promise<{
  data: ProBookingWithDetails[]
  error: Error | null
}> {
  try {
    // Get the provider's profile ID using SECURITY DEFINER (bypasses RLS)
    const { data: profileId } = await supabase.rpc('current_provider_id')

    if (!profileId) {
      return { data: [], error: null }
    }

    // Fetch all assigned bookings (active + recent completed)
    const { data: bookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', profileId)
      .in('booking_status', [
        'provider_assigned',
        'on_the_way',
        'arrived',
        'in_progress',
        'completed',
      ])
      .order('scheduled_date', { ascending: true })

    if (bookingsErr) throw bookingsErr
    if (!bookings || bookings.length === 0) {
      return { data: [], error: null }
    }

    // Same merge logic as above
    const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
    const addressIds = [...new Set(bookings.map(b => b.address_id).filter(Boolean))]

    const { data: usersData } = await supabase
      .from('users')
      .select('id, email, phone')
      .in('id', customerIds)

    const userIds = usersData?.map(u => u.id) || []

    const { data: profilesData } = await supabase
      .from('customer_profiles')
      .select('user_id, first_name, last_name, avatar_url')
      .in('user_id', userIds)

    const { data: addressesData } = await supabase
      .from('addresses')
      .select('id, street_1, city, state, zip_code, latitude, longitude')
      .in('id', addressIds)

    const usersById = new Map((usersData || []).map(u => [u.id, u]))
    const profilesById = new Map((profilesData || []).map(p => [p.user_id, p]))
    const addressesById = new Map((addressesData || []).map(a => [a.id, a]))

    const result: ProBookingWithDetails[] = bookings.map(b => {
      const user = usersById.get(b.customer_id)
      const profile = user ? profilesById.get(user.id) : null
      const address = addressesById.get(b.address_id)
      return {
        ...b,
        customer_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
        customer_avatar_url: (profile as any)?.avatar_url || null,
        customer_email: user?.email || null,
        customer_phone: user?.phone || null,
        address_line: address?.street_1 || null,
        address_city: address?.city || null,
        address_state: address?.state || null,
        address_zip: address?.zip_code || null,
        // Geofence support: customer address coords
        address_latitude: address?.latitude ?? null,
        address_longitude: address?.longitude ?? null,
      }
    })

    return { data: result, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

/**
 * Get pro's earnings broken down by today / this week / this month
 * plus a list of completed jobs with amounts.
 */
export async function getProEarningsBreakdown(providerId: string): Promise<{
  data: {
    today: number
    thisWeek: number
    thisMonth: number
    allTime: number
    pendingPayout: number
    paidOut: number
    completedJobs: ProBookingWithDetails[]
  }
  error: Error | null
}> {
  try {
    const { data: profile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', providerId)
      .single()

    if (!profile) {
      return {
        data: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          allTime: 0,
          pendingPayout: 0,
          paidOut: 0,
          completedJobs: [],
        },
        error: null,
      }
    }

    // Fetch completed bookings
    const { data: bookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', profile.id)
      .eq('booking_status', 'completed')
      .order('completed_at', { ascending: false })

    if (bookingsErr) throw bookingsErr

    // Fetch payouts
    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount, status')
      .eq('provider_id', profile.id)

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday as start of week
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    let today = 0
    let thisWeek = 0
    let thisMonth = 0
    let allTime = 0

    for (const b of bookings || []) {
      const amount = b.provider_payout_amount || 0
      const completedAt = b.completed_at ? new Date(b.completed_at) : new Date(b.updated_at || b.created_at)
      allTime += amount
      if (completedAt >= startOfMonth) thisMonth += amount
      if (completedAt >= startOfWeek) thisWeek += amount
      if (completedAt >= startOfToday) today += amount
    }

    const pendingPayout = (payouts || [])
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (p.amount || 0), 0)
    const paidOut = (payouts || [])
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    // Hydrate completed jobs with customer info (reuse the join logic, scoped)
    const completedJobs: ProBookingWithDetails[] = []
    if (bookings && bookings.length > 0) {
      const customerIds = [...new Set(bookings.map(b => b.customer_id).filter(Boolean))]
      const addressIds = [...new Set(bookings.map(b => b.address_id).filter(Boolean))]

      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, phone')
        .in('id', customerIds)
      const userIds = usersData?.map(u => u.id) || []

      const { data: profilesData } = await supabase
        .from('customer_profiles')
        .select('user_id, first_name, last_name, avatar_url')
        .in('user_id', userIds)
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('id, street_1, city, state, zip_code, latitude, longitude')
        .in('id', addressIds)

      const usersById = new Map((usersData || []).map(u => [u.id, u]))
      const profilesById = new Map((profilesData || []).map(p => [p.user_id, p]))
      const addressesById = new Map((addressesData || []).map(a => [a.id, a]))

      for (const b of bookings) {
        const user = usersById.get(b.customer_id)
        const profile = user ? profilesById.get(user.id) : null
        const address = addressesById.get(b.address_id)
        completedJobs.push({
          ...b,
          customer_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
        customer_avatar_url: (profile as any)?.avatar_url || null,
          customer_email: user?.email || null,
          customer_phone: user?.phone || null,
          address_line: address?.street_1 || null,
          address_city: address?.city || null,
          address_state: address?.state || null,
          address_zip: address?.zip_code || null,
        // Geofence support: customer address coords
        address_latitude: address?.latitude ?? null,
        address_longitude: address?.longitude ?? null,
        })
      }
    }

    return {
      data: {
        today,
        thisWeek,
        thisMonth,
        allTime,
        pendingPayout,
        paidOut,
        completedJobs,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        allTime: 0,
        pendingPayout: 0,
        paidOut: 0,
        completedJobs: [],
      },
      error: error as Error,
    }
  }
}

/**
 * Fetch the pro's skills (services they offer).
 */
export async function getProSkills(providerUserId: string): Promise<{
  data: Array<{ service_key: string; years_experience: number; is_active: boolean; display_name: string }>
  error: Error | null
}> {
  try {
    // Use SECURITY DEFINER function (bypasses RLS)
    const { data: profileId } = await supabase.rpc('current_provider_id')

    if (!profileId) return { data: [], error: null }

    const { data: skills, error } = await supabase
      .from('pro_skills')
      .select(`
        service_key,
        years_experience,
        is_active,
        pro_service_types ( display_name )
      `)
      .eq('provider_id', profileId)

    if (error) throw error

    const result = (skills || []).map((s: any) => ({
      service_key: s.service_key,
      years_experience: s.years_experience,
      is_active: s.is_active,
      display_name: s.pro_service_types?.display_name || s.service_key,
    }))

    return { data: result, error: null }
  } catch (error) {
    return { data: [], error: error as Error }
  }
}

/**
 * Add or update a skill for the pro.
 */
export async function setProSkill(
  providerUserId: string,
  serviceKey: string,
  yearsExperience: number = 0
): Promise<{ error: Error | null }> {
  try {
    // Use SECURITY DEFINER function to bypass RLS
    const { data: profileId, error: rpcError } = await supabase.rpc('current_provider_id')
    if (rpcError || !profileId) throw new Error(`Provider profile not found: ${rpcError?.message || 'no profile id'}`)

    const { error } = await supabase
      .from('pro_skills')
      .upsert(
        {
          provider_id: profileId,
          service_key: serviceKey,
          years_experience: yearsExperience,
          is_active: true,
        },
        { onConflict: 'provider_id,service_key' }
      )

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Remove a skill from the pro.
 */
export async function removeProSkill(
  providerUserId: string,
  serviceKey: string
): Promise<{ error: Error | null }> {
  try {
    // Use SECURITY DEFINER function to bypass RLS
    const { data: profileId, error: rpcError } = await supabase.rpc('current_provider_id')
    if (rpcError || !profileId) throw new Error(`Provider profile not found: ${rpcError?.message || 'no profile id'}`)

    const { error } = await supabase
      .from('pro_skills')
      .delete()
      .eq('provider_id', profileId)
      .eq('service_key', serviceKey)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}

/**
 * Mark a booking as in-progress or completed by the pro.
 */
export async function updateBookingProgress(
  bookingId: string,
  newStatus: 'on_the_way' | 'arrived' | 'in_progress' | 'completed'
): Promise<{ error: Error | null }> {
  try {
    const updates: any = {
      booking_status: newStatus,
      updated_at: new Date().toISOString(),
    }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error: bookingErr } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)

    if (bookingErr) throw bookingErr

    // Log status event
    await supabase.from('booking_status_events').insert({
      booking_id: bookingId,
      status: newStatus,
    })

    return { error: null }
  } catch (error) {
    return { error: error as Error }
  }
}
