// Supabase Edge Function: create-stripe-login-link
// Creates a one-time login link for a Stripe Connect Express account so the
// pro can manage their payout details, update bank info, edit business info,
// and download tax forms on Stripe's hosted dashboard.

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
    const { user_id } = await req.json()
    if (!user_id) {
      throw new Error('user_id is required')
    }

    // Get the pro's Stripe Connect account ID from their profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('provider_profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete')
      .eq('user_id', user_id)
      .single()

    if (profileErr || !profile) {
      throw new Error('Provider profile not found')
    }
    if (!profile.stripe_connect_account_id) {
      throw new Error('No Stripe Connect account — please complete onboarding first')
    }

    // Create a one-time login link for the Express account
    // (the link expires after a single use, so the pro gets a fresh one each time)
    const resp = await fetch(
      `https://api.stripe.com/v1/accounts/${profile.stripe_connect_account_id}/login_links`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    const data = await resp.json()
    if (!resp.ok) {
      console.error('Stripe login link error:', JSON.stringify(data))
      throw new Error(data.error?.message || 'Failed to create Stripe login link')
    }

    return new Response(
      JSON.stringify({
        url: data.url,
        onboardingComplete: profile.stripe_connect_onboarding_complete,
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
