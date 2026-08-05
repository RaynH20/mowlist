import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function getProStripeAccount(userId) {
  const url = SUPABASE_URL + "/rest/v1/provider_profiles?user_id=eq." + userId + "&select=stripe_connect_account_id&limit=1"
  const resp = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
    },
  })
  if (!resp.ok) {
    throw new Error("DB lookup failed: " + resp.status)
  }
  const rows = await resp.json()
  if (!rows || rows.length === 0) return null
  return rows[0].stripe_connect_account_id || null
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: "STRIPE_SECRET_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }

  try {
    const body = await req.json()
    const userId = body.user_id
    if (!userId) {
      throw new Error("user_id is required")
    }

    const stripeAccountId = await getProStripeAccount(userId)
    if (!stripeAccountId) {
      throw new Error("No Stripe Connect account — please complete onboarding first")
    }

    const stripeUrl = "https://api.stripe.com/v1/accounts/" + stripeAccountId + "/login_links"
    const resp = await fetch(stripeUrl, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + STRIPE_SECRET_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    const data = await resp.json()
    if (!resp.ok) {
      throw new Error(data.error?.message || "Failed to create Stripe login link")
    }

    return new Response(
      JSON.stringify({ url: data.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
