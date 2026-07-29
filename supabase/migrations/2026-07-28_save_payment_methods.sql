-- MowList: Save Payment Methods support
-- Run this in Supabase SQL Editor

-- 1. Add Stripe customer ID to users (for saved cards)
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- 2. Add Stripe customer ID to providers (for Connect)
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;
CREATE INDEX IF NOT EXISTS idx_provider_connect_id ON provider_profiles(stripe_connect_account_id);

-- 3. Add Stripe customer ID and Connect account status to providers
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false;

-- 4. Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_payment_method_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  pro_payout_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  payment_method_type TEXT,
  payment_method_brand TEXT,
  payment_method_last4 TEXT,
  receipt_url TEXT,
  metadata_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at DESC);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
DROP POLICY IF EXISTS "Customers view own payments" ON payments;
CREATE POLICY "Customers view own payments" ON payments
  FOR SELECT USING (customer_id = auth.uid());

-- Pros can view payments for their bookings
DROP POLICY IF EXISTS "Pros view payment for their jobs" ON payments;
CREATE POLICY "Pros view payment for their jobs" ON payments
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN provider_profiles pp ON b.provider_id = pp.id
      WHERE pp.user_id = auth.uid()
    )
  );

-- 5. Add default payment method to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_payment_method_id TEXT;

-- 6. Create webhook_events table to track Stripe webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events (no user RLS needed)
DROP POLICY IF EXISTS "Service role manages webhook events" ON webhook_events;
CREATE POLICY "Service role manages webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Update provider_profiles for subscription tier (free/basic/pro)
ALTER TABLE provider_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS free_jobs_remaining INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Done. Sanity check
SELECT 'users.stripe_customer_id' as column, EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
) as exists;

SELECT 'payments table' as column, EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'payments'
) as exists;
