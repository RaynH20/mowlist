// Supabase Edge Function: create-connect-account
// Creates a Stripe Connect Express account for a pro and returns the onboarding link.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') || 'https://mowlist.com'

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
    return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not set' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { user_id, email, return_url } = await req.json()
    if (!user_id || !email) {
      throw new Error('user_id and email are required')
    }

    // Get provider profile
    const { data: provider, error: provError } = await supabaseAdmin
      .from('provider_profiles')
      .select('id, stripe_connect_account_id, display_name')
      .eq('user_id', user_id)
      .single()

    if (provError || !provider) {
      throw new Error('Provider profile not found')
    }

    let accountId = provider.stripe_connect_account_id

    // Create Connect account if doesn't exist
    if (!accountId) {
      const accountParams = new URLSearchParams()
      accountParams.append('type', 'express')
      accountParams.append('country', 'US')
      accountParams.append('email', email)
      accountParams.append('capabilities[card_payments][requested]', 'true')
      accountParams.append('capabilities[transfers][requested]', 'true')
      accountParams.append('metadata[mowlist_provider_id]', provider.id)
      accountParams.append('metadata[mowlist_user_id]', user_id)
      if (provider.display_name) {
        accountParams.append('business_profile[name]', provider.display_name)
      }

      const accountResp = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: accountParams.toString(),
      })

      const accountData = await accountResp.json()
      if (!accountResp.ok) {
        throw new Error(accountData.error?.message || 'Failed to create Connect account')
      }

      accountId = accountData.id

      // Save to provider profile
      await supabaseAdmin
        .from('provider_profiles')
        .update({ stripe_connect_account_id: accountId })
        .eq('id', provider.id)
    }

    // Create account link for onboarding
    const linkParams = new URLSearchParams()
    linkParams.append('account', accountId)
    linkParams.append('refresh_url', `${return_url || SITE_URL}/pro/profile?refresh=true`)
    linkParams.append('return_url', `${return_url || SITE_URL}/pro/profile?connected=true`)
    linkParams.append('type', 'account_onboarding')

    const linkResp = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: linkParams.toString(),
    })

    const linkData = await linkResp.json()
    if (!linkResp.ok) {
      throw new Error(linkData.error?.message || 'Failed to create onboarding link')
    }

    return new Response(
      JSON.stringify({
        accountId,
        onboardingUrl: linkData.url,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
