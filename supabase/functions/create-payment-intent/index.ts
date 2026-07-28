// Supabase Edge Function: create-payment-intent
// Creates a Stripe PaymentIntent and returns the client secret.
// Deploy via Supabase Dashboard → Edge Functions → New function
// Secret to set: STRIPE_SECRET_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
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
    const { amount, booking_id, customer_email, customer_name } = await req.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error('amount is required and must be a positive number')
    }
    if (!booking_id) {
      throw new Error('booking_id is required')
    }

    // Convert dollars to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100)

    // Create a PaymentIntent via Stripe REST API
    const params = new URLSearchParams()
    params.append('amount', amountInCents.toString())
    params.append('currency', 'usd')
    params.append('automatic_payment_methods[enabled]', 'true')
    params.append('metadata[booking_id]', booking_id)
    if (customer_email) params.append('receipt_email', customer_email)
    if (customer_name) params.append('metadata[customer_name]', customer_name)
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

    return new Response(
      JSON.stringify({
        clientSecret: data.client_secret,
        paymentIntentId: data.id,
        amount: data.amount,
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
