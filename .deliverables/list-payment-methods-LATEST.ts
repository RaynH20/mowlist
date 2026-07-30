// Supabase Edge Function: list-payment-methods
// Returns the customer's saved payment methods (cards) from Stripe

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
    const { user_id, default_payment_method_id } = await req.json()
    if (!user_id) {
      throw new Error('user_id is required')
    }

    // Get the customer's Stripe ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('stripe_customer_id, default_payment_method_id')
      .eq('id', user_id)
      .single()

    if (userError || !user?.stripe_customer_id) {
      // No Stripe customer yet = no saved cards
      return new Response(
        JSON.stringify({ paymentMethods: [], defaultPaymentMethodId: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List payment methods from Stripe
    const resp = await fetch(
      `https://api.stripe.com/v1/payment_methods?customer=${user.stripe_customer_id}&type=card`,
      {
        headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}` },
      }
    )
    const data = await resp.json()
    if (!resp.ok) {
      console.error('Stripe list error:', JSON.stringify(data))
      throw new Error(data.error?.message || 'Failed to list payment methods')
    }

    // Format for the frontend
    const paymentMethods = (data.data || []).map((pm: any) => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === (default_payment_method_id || user.default_payment_method_id),
    }))

    return new Response(
      JSON.stringify({
        paymentMethods,
        defaultPaymentMethodId: default_payment_method_id || user.default_payment_method_id || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
