// Supabase Edge Function: create-payment-intent
// Creates a Stripe Customer (if needed) and a PaymentIntent.
// For paid bookings with assigned pros, also creates a Transfer to the pro's Connect account.
// Saves the customer ID to our users table so future payments can reuse the saved card.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PLATFORM_FEE_PERCENT = 20 // MowList takes 20%

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id, phone')
    .eq('id', userId)
    .single()

  if (user?.stripe_customer_id) {
    return user.stripe_customer_id
  }

  // Search Stripe for existing customer
  const searchResp = await fetch(
    `https://api.stripe.com/v1/customers/search?query=email:'${encodeURIComponent(email)}'&limit=1`,
    { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
  )
  const searchData = await searchResp.json()

  let customerId: string
  if (searchData.data && searchData.data.length > 0) {
    customerId = searchData.data[0].id
  } else {
    const createParams = new URLSearchParams()
    createParams.append('email', email)
    if (name) createParams.append('name', name)
    if (user?.phone) createParams.append('phone', user.phone)
    createParams.append('metadata[mowlist_user_id]', userId)

    const createResp = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: createParams.toString(),
    })
    const createData = await createResp.json()
    if (!createResp.ok) {
      throw new Error(createData.error?.message || 'Failed to create Stripe customer')
    }
    customerId = createData.id
  }

  await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: customerId })
    .eq('id', userId)

  return customerId
}

/**
 * Get the pro's Stripe Connect account for a booking.
 * Returns null if no pro assigned or pro hasn't connected Stripe.
 */
async function getProConnectAccount(bookingId: string): Promise<string | null> {
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select(`
      provider_id,
      provider_profiles!bookings_provider_id_fkey(stripe_connect_account_id, stripe_connect_charges_enabled)
    `)
    .eq('id', bookingId)
    .single()

  if (!booking?.provider_profiles) return null
  const profile: any = booking.provider_profiles
  if (!profile.stripe_connect_charges_enabled) return null
  return profile.stripe_connect_account_id
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'STRIPE_SECRET_KEY is not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const {
      amount,
      booking_id,
      customer_email,
      customer_name,
      user_id,
      save_card,
      payment_method_id,
    } = await req.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('amount is required and must be a positive number')
    }
    if (!booking_id) {
      throw new Error('booking_id is required')
    }
    if (!user_id) {
      throw new Error('user_id is required')
    }

    const amountInCents = Math.round(amount * 100)

    // Get or create the Stripe Customer
    const stripeCustomerId = await getOrCreateCustomer(user_id, customer_email, customer_name)

    // Check if there's a pro with Stripe Connect set up for this booking
    const proConnectAccountId = await getProConnectAccount(booking_id)
    // MowList's cut is the same whether or not a pro is attached yet — the pro
    // is usually assigned AFTER payment, and the payout is transferred at
    // capture time. Computing the fee only when a pro already existed meant
    // provider_payout_amount was recorded as the full ticket price.
    const platformFeeCents = Math.round(amountInCents * PLATFORM_FEE_PERCENT / 100)

    // Build the PaymentIntent
    const params = new URLSearchParams()
    params.append('amount', amountInCents.toString())
    params.append('currency', 'usd')
    params.append('customer', stripeCustomerId)
    // Manual capture: the customer's card is AUTHORIZED at booking time
    // but the charge isn't captured until the pro finishes the job AND
    // the customer approves (or the 24h window expires).
    // See capture-payment edge function for the actual capture.
    params.append('capture_method', 'manual')
    params.append('automatic_payment_methods[enabled]', 'true')

    if (payment_method_id) {
      // Using a saved card: attach the payment method to the PaymentIntent
      // The frontend will confirm via stripe.confirmCardPayment(clientSecret)
      params.append('payment_method', payment_method_id)
    } else if (save_card) {
      // New card with save-for-future-use: setup_future_usage tells Stripe to
      // attach the payment method to the customer after the payment succeeds
      params.append('setup_future_usage', 'off_session')
    }

    // NOTE ON PAYOUTS — do NOT add transfer_data / application_fee_amount here.
    //
    // `transfer_data[destination]` (a "destination charge") has to name the
    // connected account at PaymentIntent creation time. On MowList the customer
    // pays BEFORE a pro accepts the job, so at this moment there usually is no
    // pro yet — which is exactly why payouts were landing in the platform
    // account instead of the pro's.
    //
    // MowList uses "separate charges and transfers" instead: the charge lands
    // on the platform account, and capture-payment creates a Transfer to the
    // pro's connected account once the job is approved and the pro is known.
    // `platformFeeCents` below is kept for reporting/metadata only.

    params.append('metadata[booking_id]', booking_id)
    params.append('metadata[mowlist_user_id]', user_id)
    if (customer_email) params.append('receipt_email', customer_email)
    if (customer_name) params.append('metadata[customer_name]', customer_name)
    if (proConnectAccountId) {
      params.append('metadata[pro_connect_account]', proConnectAccountId)
    }
    params.append('description', `MowList Booking #${booking_id.slice(0, 8)}`)

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Stripe error:', JSON.stringify(data))
      throw new Error(data.error?.message || 'Stripe API error')
    }

    // Record the PaymentIntent on the booking. capture-payment reads
    // `bookings.payment_intent_id` to know what to capture — nothing was ever
    // writing it, so every capture failed with "No payment intent on this
    // booking" and authorized funds silently expired instead of being charged.
    const { error: linkErr } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_intent_id: data.id,
        platform_fee: platformFeeCents / 100,
        provider_payout_amount: (amountInCents - platformFeeCents) / 100,
      })
      .eq('id', booking_id)

    if (linkErr) {
      // Don't fail the payment over this, but make it loud — an unlinked
      // PaymentIntent means the money can never be captured.
      console.error('CRITICAL: could not link payment_intent to booking', booking_id, linkErr)
    }

    return new Response(
      JSON.stringify({
        clientSecret: data.client_secret,
        paymentIntentId: data.id,
        amount: data.amount,
        customerId: stripeCustomerId,
        platformFeeCents,
        hasConnect: !!proConnectAccountId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
