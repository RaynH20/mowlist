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

// Keep in sync with create-payment-intent.
const PLATFORM_FEE_PERCENT = 15 // MowList takes 15%

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

    // Fetch the booking to find the payment intent + who to pay
    const { data: booking, error: bErr } = await supabaseAdmin
      .from('bookings')
      .select(`
        id, payment_intent_id, payment_status, booking_status, customer_id,
        provider_id, estimated_price, provider_payout_amount,
        provider_profiles!bookings_provider_id_fkey(
          stripe_connect_account_id, stripe_connect_payouts_enabled
        )
      `)
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

    // Fall back to the payments table for bookings paid before
    // create-payment-intent started writing bookings.payment_intent_id.
    let paymentIntentId: string | null = booking.payment_intent_id
    if (!paymentIntentId) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('stripe_payment_intent_id')
        .eq('booking_id', booking_id)
        .not('stripe_payment_intent_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      paymentIntentId = payment?.stripe_payment_intent_id ?? null
      if (paymentIntentId) {
        await supabaseAdmin
          .from('bookings')
          .update({ payment_intent_id: paymentIntentId })
          .eq('id', booking_id)
      }
    }

    if (!paymentIntentId) {
      throw new Error('No payment intent on this booking')
    }

    // Capture the payment in Stripe
    const captureResp = await fetch(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}/capture`,
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

    // ---------------------------------------------------------------------
    // Pay the pro (separate charges and transfers)
    //
    // The charge lands on the MowList platform account because the pro isn't
    // known when the customer pays. Now that the job is approved and we know
    // who did it, move their cut to their connected account. `source_transaction`
    // ties the transfer to this specific charge so Stripe waits for the funds
    // to become available instead of drawing on the platform balance.
    //
    // This is best-effort: a failed transfer must never roll back a successful
    // capture. It's logged and left for the admin payouts screen to retry.
    // ---------------------------------------------------------------------
    let transferId: string | null = null
    let transferError: string | null = null
    const proProfile: any = (booking as any).provider_profiles
    const chargeId: string | null = captureData.latest_charge || null

    if (proProfile?.stripe_connect_account_id && proProfile?.stripe_connect_payouts_enabled && chargeId) {
      const capturedCents = captureData.amount_received ?? captureData.amount ?? 0
      // Prefer the payout amount already computed on the booking; otherwise
      // fall back to the captured amount minus the platform fee.
      const payoutCents = booking.provider_payout_amount
        ? Math.round(Number(booking.provider_payout_amount) * 100)
        : Math.round(capturedCents * (100 - PLATFORM_FEE_PERCENT) / 100)

      if (payoutCents > 0 && payoutCents <= capturedCents) {
        const transferParams = new URLSearchParams()
        transferParams.append('amount', String(payoutCents))
        transferParams.append('currency', 'usd')
        transferParams.append('destination', proProfile.stripe_connect_account_id)
        transferParams.append('source_transaction', chargeId)
        transferParams.append('transfer_group', `booking_${booking_id}`)
        transferParams.append('metadata[booking_id]', booking_id)

        const transferResp = await fetch('https://api.stripe.com/v1/transfers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            // Never pay a pro twice for the same booking, even if this function
            // is retried by pg_cron or double-clicked by the customer.
            'Idempotency-Key': `mowlist_payout_${booking_id}`,
          },
          body: transferParams.toString(),
        })
        const transferData = await transferResp.json()
        if (transferResp.ok) {
          transferId = transferData.id
        } else {
          transferError = transferData.error?.message || 'Transfer failed'
          console.error('Stripe transfer error:', JSON.stringify(transferData))
        }
      } else {
        transferError = `Refusing to transfer ${payoutCents} cents against a ${capturedCents} cent capture`
        console.error(transferError)
      }
    } else if (booking.provider_id) {
      transferError = 'Pro has no Stripe Connect account with payouts enabled'
      console.warn(transferError, { booking_id, provider_id: booking.provider_id })
    }

    // Update the booking
    const updates: any = {
      payment_status: 'captured',
      payment_captured_at: new Date().toISOString(),
    }
    if (transferId) {
      updates.stripe_transfer_id = transferId
      updates.provider_paid_at = new Date().toISOString()
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
        payment_intent_id: paymentIntentId,
        amount_captured: captureData.amount_received,
        reason: reason || 'manual',
        transfer_id: transferId,
        transfer_error: transferError,
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
