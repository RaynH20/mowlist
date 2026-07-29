// Helpers for Stripe customer / saved card operations
// All calls go through Supabase Edge Functions (server-side Stripe calls)

import { supabase } from './supabase'

export interface SavedPaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

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

export interface CreatePaymentIntentParams {
  amount: number
  booking_id: string
  user_id: string
  customer_email: string
  customer_name?: string
  save_card?: boolean
  payment_method_id?: string
}

export interface CreatePaymentIntentResult {
  clientSecret: string
  paymentIntentId: string
  amount: number
  customerId: string
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<CreatePaymentIntentResult> {
  return callEdgeFunction<CreatePaymentIntentResult>('create-payment-intent', params)
}

export async function listPaymentMethods(
  user_id: string
): Promise<{ paymentMethods: SavedPaymentMethod[]; defaultPaymentMethodId: string | null }> {
  return callEdgeFunction('list-payment-methods', { user_id })
}

export async function deletePaymentMethod(payment_method_id: string): Promise<void> {
  await callEdgeFunction('delete-payment-method', { payment_method_id })
}

export async function setDefaultPaymentMethod(user_id: string, payment_method_id: string): Promise<void> {
  // Update via Supabase client
  const { error } = await supabase
    .from('users')
    .update({ default_payment_method_id: payment_method_id })
    .eq('id', user_id)
  if (error) throw new Error(error.message)
}

// Brand display name mapping
export function getCardBrandLabel(brand: string): string {
  const map: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  }
  return map[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1)
}
