// Helpers for Stripe Connect (pro onboarding and payouts)

import { supabase } from './supabase'

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

async function callEdgeFunction<T>(name: string, body: any): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const resp = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  if (!resp.ok || data.error) {
    throw new Error(data.error || `${name} failed`)
  }
  return data as T
}

export interface CreateConnectAccountResult {
  accountId: string
  onboardingUrl: string
}

export async function startConnectOnboarding(
  user_id: string,
  email: string,
  return_url?: string
): Promise<CreateConnectAccountResult> {
  return callEdgeFunction<CreateConnectAccountResult>('create-connect-account', {
    user_id,
    email,
    return_url,
  })
}

// Create a one-time login link for the pro's Stripe Express dashboard so
// they can update bank info, edit business details, or download tax forms.
export async function createStripeLoginLink(user_id: string): Promise<{ url: string }> {
  return callEdgeFunction<{ url: string }>('create-stripe-login-link', { user_id })
}
