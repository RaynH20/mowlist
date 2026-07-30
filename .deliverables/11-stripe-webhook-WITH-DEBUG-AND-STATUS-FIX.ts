// Supabase Edge Function: stripe-webhook
// Receives Stripe webhook events and updates our database accordingly.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Verify the Stripe webhook signature
 * https://stripe.com/docs/webhooks/signatures
 */
async function verifyStripeSignature(body: string, sigHeader: string): Promise<boolean> {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not set, skipping verification')
    return true // Allow in dev; should fail in prod
  }

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Parse the signature header
    const elements = sigHeader.split(',').reduce((acc: Record<string, string>, item) => {
      const [key, value] = item.split('=')
      acc[key] = value
      return acc
    }, {})

    const t = elements.t
    const v1 = elements.v1
    if (!t || !v1) return false

    const signedPayload = `${t}.${body}`
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
    const expected = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return expected === v1
  } catch (err) {
    console.error('Signature verification error:', err)
    return false
  }
}

/**
 * Record the webhook event for idempotency / audit
 */
async function recordEvent(eventId: string, eventType: string, payload: any): Promise<boolean> {
  // Check if already processed
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single()

  if (existing) {
    console.log(`Event ${eventId} already processed, skipping`)
    return false
  }

  // Insert (with conflict handling for race conditions)
  const { error } = await supabaseAdmin.from('webhook_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    payload,
  })

  if (error && error.code !== '23505') {
    console.error('Failed to record event:', error)
  }
  return true
}

async function markEventProcessed(eventId: string, error?: string) {
  await supabaseAdmin
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString(), error })
    .eq('stripe_event_id', eventId)
}

serve(async (req) => {
  console.log('[stripe-webhook] hit:', req.method, new URL(req.url).pathname)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!STRIPE_SECRET_KEY) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY not set')
    return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not set' }), {
      status: 500,
      headers: corsHeaders,
    })
  }

  const sigHeader = req.headers.get('stripe-signature')
  const body = await req.text()
  console.log('[stripe-webhook] body length:', body.length, 'has signature:', !!sigHeader)

  // Verify signature
  if (sigHeader) {
    const valid = await verifyStripeSignature(body, sigHeader)
    if (!valid) {
      console.error('[stripe-webhook] INVALID SIGNATURE — rejecting')
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: corsHeaders,
      })
    }
  }

  let event: any
  try {
    event = JSON.parse(body)
    console.log('[stripe-webhook] event type:', event.type, 'id:', event.id)
  } catch (err) {
    console.error('[stripe-webhook] INVALID JSON:', err)
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: corsHeaders,
    })
  }

  // Idempotency check
  const shouldProcess = await recordEvent(event.id, event.type, event.data?.object)
  if (!shouldProcess) {
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      headers: corsHeaders,
    })
  }

  try {
    // Handle specific event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object
        const bookingId = pi.metadata?.booking_id
        const userId = pi.metadata?.mowlist_user_id
        const customerId = pi.customer
        const paymentMethodId = pi.payment_method

        // Fetch the charge to get the receipt URL (PaymentIntent's receipt_email
        // gets a Stripe-hosted receipt, but the URL lives on the charge object)
        let receiptUrl: string | null = null
        if (pi.latest_charge) {
          try {
            const chargeResp = await fetch(
              `https://api.stripe.com/v1/charges/${pi.latest_charge}`,
              { headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` } }
            )
            const chargeData = await chargeResp.json()
            receiptUrl = chargeData.receipt_url || null
          } catch (e) {
            console.error('Failed to fetch charge for receipt URL:', e)
          }
        }

        // Update or insert payment record
        await supabaseAdmin.from('payments').upsert(
          {
            booking_id: bookingId,
            customer_id: userId,
            stripe_payment_intent_id: pi.id,
            stripe_charge_id: pi.latest_charge,
            stripe_payment_method_id: paymentMethodId,
            amount: pi.amount / 100,
            currency: pi.currency,
            status: 'succeeded',
            payment_method_type: pi.payment_method_types?.[0] || null,
            receipt_url: receiptUrl,
            metadata_json: pi.metadata || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_payment_intent_id' }
        )

        // Update booking payment status + flip booking to 'booked' if it's
        // still waiting for customer payment (status 'provider_assigned').
        // Only flip if the booking is in 'provider_assigned' state — we don't
        // want to clobber an in-progress or completed booking.
        if (bookingId) {
          await supabaseAdmin
            .from('bookings')
            .update({ payment_status: 'paid', booking_status: 'booked' })
            .eq('id', bookingId)
            .eq('booking_status', 'provider_assigned')
        }

        // Belt-and-suspenders: explicitly attach the payment method to the customer
        // (in case setup_future_usage didn't auto-attach it)
        if (customerId && paymentMethodId) {
          try {
            // Attach to customer (idempotent — Stripe ignores if already attached)
            const attachResp = await fetch(
              `https://api.stripe.com/v1/payment_methods/${paymentMethodId}/attach`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `customer=${customerId}`,
              }
            )
            const attachData = await attachResp.json()
            if (!attachResp.ok && attachData.error?.code !== 'resource_already_attached') {
              console.error('Failed to attach payment method:', JSON.stringify(attachData.error))
            } else {
              console.log(`Payment method ${paymentMethodId} attached to customer ${customerId}`)
            }
          } catch (attachErr) {
            console.error('Attach payment method error:', attachErr)
          }

          // If this is the user's first payment method, set it as default
          if (userId) {
            try {
              const { data: user } = await supabaseAdmin
                .from('users')
                .select('default_payment_method_id')
                .eq('id', userId)
                .single()
              if (!user?.default_payment_method_id) {
                await supabaseAdmin
                  .from('users')
                  .update({ default_payment_method_id: paymentMethodId })
                  .eq('id', userId)
                console.log(`Set default payment method for user ${userId}`)
              }
            } catch (defaultErr) {
              console.error('Set default error:', defaultErr)
            }
          }
        }

        console.log(`Payment succeeded for booking ${bookingId}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const bookingId = pi.metadata?.booking_id

        await supabaseAdmin.from('payments').upsert(
          {
            booking_id: bookingId,
            customer_id: pi.metadata?.mowlist_user_id,
            stripe_payment_intent_id: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency,
            status: 'failed',
            metadata_json: pi.metadata || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_payment_intent_id' }
        )

        if (bookingId) {
          await supabaseAdmin
            .from('bookings')
            .update({ payment_status: 'failed' })
            .eq('id', bookingId)
        }

        console.log(`Payment failed for booking ${bookingId}`)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const piId = charge.payment_intent

        if (piId) {
          await supabaseAdmin
            .from('payments')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('stripe_payment_intent_id', piId)
        }

        // Update booking status
        const { data: payment } = await supabaseAdmin
          .from('payments')
          .select('booking_id')
          .eq('stripe_payment_intent_id', piId)
          .single()
        if (payment?.booking_id) {
          await supabaseAdmin
            .from('bookings')
            .update({ booking_status: 'cancelled', payment_status: 'refunded' })
            .eq('id', payment.booking_id)
        }
        break
      }

      case 'account.updated': {
        // Stripe Connect account status update
        const account = event.data.object
        const connectId = account.id

        await supabaseAdmin
          .from('provider_profiles')
          .update({
            stripe_connect_charges_enabled: account.charges_enabled || false,
            stripe_connect_payouts_enabled: account.payouts_enabled || false,
            stripe_connect_onboarding_complete: account.details_submitted || false,
          })
          .eq('stripe_connect_account_id', connectId)

        console.log(`Connect account ${connectId} updated`)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // For pro subscriptions
        const sub = event.data.object
        const providerId = sub.metadata?.provider_id

        if (providerId) {
          const tier = sub.metadata?.tier || 'basic'
          await supabaseAdmin
            .from('provider_profiles')
            .update({
              stripe_subscription_id: sub.id,
              subscription_tier: tier,
              subscription_status: sub.status,
            })
            .eq('id', providerId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    await markEventProcessed(event.id)
    return new Response(JSON.stringify({ received: true }), {
      headers: corsHeaders,
    })
  } catch (err: any) {
    console.error(`Error processing ${event.type}:`, err)
    await markEventProcessed(event.id, err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
