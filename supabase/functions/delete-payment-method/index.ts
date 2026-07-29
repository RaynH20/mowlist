// Supabase Edge Function: delete-payment-method
// Detaches a payment method from the customer

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')

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
    const { payment_method_id } = await req.json()
    if (!payment_method_id) {
      throw new Error('payment_method_id is required')
    }

    // Detach the payment method (don't delete, just unlink from customer)
    const resp = await fetch(
      `https://api.stripe.com/v1/payment_methods/${payment_method_id}/detach`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
      }
    )
    const data = await resp.json()
    if (!resp.ok) {
      throw new Error(data.error?.message || 'Failed to detach payment method')
    }

    return new Response(
      JSON.stringify({ success: true, paymentMethodId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
