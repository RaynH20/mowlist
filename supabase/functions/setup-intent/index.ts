// Supabase Edge Function: setup-intent
// Creates a Stripe SetupIntent so a customer can save a card without making a payment.
// Useful for the "Add a card" flow in /dashboard/payment.

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
    const { user_id, customer_email, customer_name } = await req.json()

    if (!user_id) {
      throw new Error('user_id is required')
    }
    if (!customer_email) {
      throw new Error('customer_email is required')
    }

    // Get or create the Stripe Customer
    const stripeCustomerId = await getOrCreateCustomer(user_id, customer_email, customer_name)

    // Create a SetupIntent for saving the card
    const params = new URLSearchParams()
    params.append('customer', stripeCustomerId)
    params.append('usage', 'off_session')
    params.append('payment_method_types[]', 'card')
    params.append('metadata[mowlist_user_id]', user_id)

    const response = await fetch('https://api.stripe.com/v1/setup_intents', {
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
        customerId: stripeCustomerId,
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
