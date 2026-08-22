// Supabase Edge Function: stripe-webhook
// Receives Stripe webhook events and updates our database accordingly.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Keep in sync with create-payment-intent / capture-payment.
const PLATFORM_FEE_PERCENT = 15 // MowList takes 15%

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
/**
 * Collects every failed database write in one invocation.
 *
 * Supabase does NOT throw when a write is rejected — it resolves with
 * `{ data, error }`. Every write in this file discarded that result, so a
 * rejected insert produced a 200 OK, no log line, and no row. That is why the
 * payments table stayed empty with nothing at all in the logs.
 */
function makeWriteRecorder(eventId: string) {
  const failures: string[] = []
  return {
    failures,
    check(label: string, res: any) {
      const err = res?.error
      if (!err) return res
      const parts = [err.message]
      if (err.code) parts.push(`code=${err.code}`)
      if (err.details) parts.push(err.details)
      if (err.hint) parts.push(`hint=${err.hint}`)
      const msg = `${label}: ${parts.join(' | ')}`
      console.error(`[stripe-webhook] WRITE FAILED (${eventId}) ${msg}`)
      // 42P10 is the one that bites an upsert: ON CONFLICT names a column with
      // no unique constraint behind it. Say so in plain language.
      if (err.code === '42P10') {
        console.error(
          '[stripe-webhook] ^ the ON CONFLICT column has no UNIQUE constraint. ' +
          'Add a unique index on payments.stripe_payment_intent_id or this ' +
          'upsert can never succeed.'
        )
      }
      failures.push(msg)
      return res
    },
  }
}

/**
 * A drop-in stand-in for `supabaseAdmin` that reports failed writes to `w`.
 *
 * Rather than wrapping every call site, this patches the thenable returned by
 * insert/update/upsert/delete so that awaiting it also runs the error check.
 * Call sites stay exactly as they were.
 */
function recordingClient(w: ReturnType<typeof makeWriteRecorder>) {
  return {
    from(table: string) {
      const qb: any = supabaseAdmin.from(table)
      for (const method of ['insert', 'update', 'upsert', 'delete'] as const) {
        const original = qb[method].bind(qb)
        qb[method] = (...args: any[]) => {
          const builder: any = original(...args)
          const originalThen = builder.then.bind(builder)
          builder.then = (onFulfilled: any, onRejected: any) =>
            originalThen((res: any) => {
              w.check(`${table}.${method}`, res)
              return onFulfilled ? onFulfilled(res) : res
            }, onRejected)
          return builder
        }
      }
      return qb
    },
  }
}

async function recordEvent(eventId: string, eventType: string, payload: any): Promise<boolean> {
  // Only skip an event we have already handled SUCCESSFULLY. Previously ANY
  // recorded event was skipped, so once an event failed it could never be
  // retried — not by Stripe, not by a manual resend from the dashboard.
  const { data: existing } = await supabaseAdmin
    .from('webhook_events')
    .select('id, processed_at, error')
    .eq('stripe_event_id', eventId)
    .maybeSingle()

  if (existing?.processed_at && !existing.error) {
    console.log(`Event ${eventId} already processed successfully, skipping`)
    return false
  }

  if (existing) {
    console.log(`Event ${eventId} was seen before but did not succeed — retrying`)
    return true
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
    // `error: undefined` gets dropped from the JSON body, which would leave a
    // stale error in place on a successful retry. Send an explicit null.
    .update({ processed_at: new Date().toISOString(), error: error ?? null })
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

  // `db` behaves exactly like supabaseAdmin, but a rejected write is logged
  // and collected instead of silently discarded.
  const w = makeWriteRecorder(event.id)
  const db = recordingClient(w)

  try {
    // Handle specific event types
    switch (event.type) {
      // MowList authorizes the card up front and captures after the customer
      // approves the work. With capture_method: 'manual', Stripe fires
      // `amount_capturable_updated` at authorization time and only fires
      // `payment_intent.succeeded` later, at capture. Both need handling:
      // authorization is when the booking becomes paid-for and trackable.
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object
        const bookingId = pi.metadata?.booking_id
        const userId = pi.metadata?.mowlist_user_id

        const totalAmount = pi.amount / 100
        const platformFeeCents = Math.round(pi.amount * PLATFORM_FEE_PERCENT / 100)
        const platformFee = platformFeeCents / 100
        const proPayout = (pi.amount - platformFeeCents) / 100

        await db.from('payments').upsert(
          {
            booking_id: bookingId,
            customer_id: userId,
            stripe_payment_intent_id: pi.id,
            stripe_charge_id: pi.latest_charge,
            stripe_payment_method_id: pi.payment_method,
            amount: totalAmount,
            platform_fee: platformFee,
            pro_payout_amount: proPayout,
            currency: pi.currency,
            status: 'authorized',
            payment_method_type: pi.payment_method_types?.[0] || null,
            metadata_json: pi.metadata || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_payment_intent_id' }
        )

        if (bookingId) {
          await db
            .from('bookings')
            .update({
              payment_intent_id: pi.id,
              payment_status: 'authorized',
              platform_fee: platformFee,
              provider_payout_amount: proPayout,
            })
            .eq('id', bookingId)
        }
        break
      }

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

        // Calculate platform fee and pro payout. When the booking was paid
        // through a connected pro account, Stripe already split the money
        // (application_fee_amount + transfer_data[destination]). For direct
        // MowList payments (no connected pro), the entire amount is the
        // platform's revenue — pro_payout_amount stays 0.
        // MowList uses separate charges and transfers, so there is no
        // `application_fee_amount` on the PaymentIntent — it used to be read
        // straight off the PI, which meant platform_fee was always $0 and the
        // pro's payout was recorded as the full ticket price.
        const totalAmount = pi.amount / 100
        const platformFeeCents = Math.round(pi.amount * PLATFORM_FEE_PERCENT / 100)
        const platformFee = platformFeeCents / 100
        const proPayout = (pi.amount - platformFeeCents) / 100

        // Update or insert payment record
        await db.from('payments').upsert(
          {
            booking_id: bookingId,
            customer_id: userId,
            stripe_payment_intent_id: pi.id,
            stripe_charge_id: pi.latest_charge,
            stripe_payment_method_id: paymentMethodId,
            amount: totalAmount,
            platform_fee: platformFee,
            pro_payout_amount: proPayout,
            currency: pi.currency,
            // 'succeeded' is not one of the allowed payment statuses
            // (pending / authorized / captured / failed / refunded /
            // partially_refunded) — writing it silently failed the insert.
            status: 'captured',
            payment_method_type: pi.payment_method_types?.[0] || null,
            receipt_url: receiptUrl,
            metadata_json: pi.metadata || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_payment_intent_id' }
        )

        // Update booking: payment status, flip to 'booked', and save the pro's
        // payout amount on the booking itself (the pro earnings page reads
        // from bookings.provider_payout_amount). Only flip booking_status if
        // it's in 'provider_assigned' so we don't clobber in-progress jobs.
        if (bookingId) {
          // 'paid' is not an allowed payment_status value — this whole update
          // was being rejected by the CHECK constraint, so captured payments
          // never showed up on the booking.
          await db
            .from('bookings')
            .update({
              payment_status: 'captured',
              payment_captured_at: new Date().toISOString(),
              platform_fee: platformFee,
              provider_payout_amount: proPayout,
            })
            .eq('id', bookingId)
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
              const { data: user } = await db
                .from('users')
                .select('default_payment_method_id')
                .eq('id', userId)
                .single()
              if (!user?.default_payment_method_id) {
                await db
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

        await db.from('payments').upsert(
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
          await db
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
          await db
            .from('payments')
            .update({ status: 'refunded', updated_at: new Date().toISOString() })
            .eq('stripe_payment_intent_id', piId)
        }

        // Update booking status
        const { data: payment } = await db
          .from('payments')
          .select('booking_id')
          .eq('stripe_payment_intent_id', piId)
          .single()
        if (payment?.booking_id) {
          await db
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

        await db
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
          await db
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

    if (w.failures.length > 0) {
      // At least one write was rejected. Record the real reason and return 500
      // so Stripe retries, and so the failure is visible in the Stripe
      // dashboard instead of looking like a clean delivery.
      const summary = w.failures.join(' || ')
      console.error(
        `[stripe-webhook] ${event.type} finished with ${w.failures.length} failed write(s): ${summary}`
      )
      await markEventProcessed(event.id, summary)
      return new Response(
        JSON.stringify({ received: true, ok: false, errors: w.failures }),
        { status: 500, headers: corsHeaders }
      )
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
