// Supabase Edge Function: capture-payment
// Captures a previously authorized PaymentIntent (manual capture).
// Called when:
//   1. Customer approves the completed work (immediate capture)
//   2. pg_cron job auto-captures after 24h (no action by customer)
//
// The PaymentIntent must have been created with `capture_method: 'manual'`
// (which is what create-payment-intent does for MowList).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const { booking_id, reason } = await req.json()

    if (!booking_id) {
      throw new Error('booking_id is required')
    }

    // Fetch the booking to find the payment intent
    const { data: booking, error: bErr } = await supabaseAdmin
      .from('bookings')
      .select('id, payment_intent_id, payment_status, booking_status, customer_id')
      .eq('id', booking_id)
      .single()

    if (bErr || !booking) {
      throw new Error('Booking not found')
    }

    if (booking.payment_status === 'captured') {
      return new Response(
        JSON.stringify({ ok: true, message: 'Payment already captured', payment_intent_id: booking.payment_intent_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!booking.payment_intent_id) {
      throw new Error('No payment intent on this booking')
    }

    // Capture the payment in Stripe
    const captureResp = await fetch(
      `https://api.stripe.com/v1/payment_intents/${booking.payment_intent_id}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({}).toString(),
      }
    )

    const captureData = await captureResp.json()
    if (!captureResp.ok) {
      console.error('Stripe capture error:', JSON.stringify(captureData))
      throw new Error(captureData.error?.message || 'Failed to capture payment')
    }

    // Update the booking
    const updates: any = {
      payment_status: 'captured',
      payment_captured_at: new Date().toISOString(),
    }

    // If reason is 'auto_capture' (called by pg_cron) and booking is still pending_review,
    // mark it completed. If customer approved manually, this is already done.
    if (booking.booking_status === 'pending_review') {
      updates.booking_status = 'completed'
      updates.completed_at = new Date().toISOString()
    }

    await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', booking_id)

    return new Response(
      JSON.stringify({
        ok: true,
        payment_intent_id: booking.payment_intent_id,
        amount_captured: captureData.amount_received,
        reason: reason || 'manual',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('capture-payment error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
