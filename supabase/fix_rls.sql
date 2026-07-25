-- Fix for RLS policy blocking user signup trigger
-- Run this in Supabase SQL Editor to fix the signup issue

-- Drop existing policies on users table that might block inserts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Allow anyone to insert into users table (needed for signup trigger)
CREATE POLICY "allow_insert_users" ON users
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "users_view_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all users
CREATE POLICY "admins_view_all" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Also fix customer_profiles if needed
DROP POLICY IF EXISTS "Customers can view own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Admins can view all customer profiles" ON customer_profiles;

CREATE POLICY "customer_view_own" ON customer_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "customer_update_own" ON customer_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "customer_insert_own" ON customer_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_view_customers" ON customer_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Also fix provider_profiles if needed
DROP POLICY IF EXISTS "Providers can view own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can update own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Public can view verified providers" ON provider_profiles;
DROP POLICY IF EXISTS "Admins can view all provider profiles" ON provider_profiles;

CREATE POLICY "provider_view_own" ON provider_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "provider_update_own" ON provider_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "provider_insert_own" ON provider_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "public_view_verified" ON provider_profiles
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "admin_view_providers" ON provider_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
