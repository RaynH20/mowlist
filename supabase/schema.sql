-- MowList Database Schema
-- Run this in Supabase SQL Editor to create all required tables

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')) DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- CUSTOMER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  default_address_id UUID,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'text')) DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own profile" ON customer_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Customers can update own profile" ON customer_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all customer profiles" ON customer_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- PROVIDER PROFILES
-- =============================================
CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  phone_visible BOOLEAN DEFAULT false,
  average_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  service_radius_miles INTEGER DEFAULT 10,
  onboarding_status TEXT CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  stripe_connect_account_id TEXT,
  payout_status TEXT CHECK (payout_status IN ('pending', 'active', 'disabled')) DEFAULT 'pending',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own profile" ON provider_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Providers can update own profile" ON provider_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Public can view verified providers" ON provider_profiles
  FOR SELECT USING (verification_status = 'verified');

CREATE POLICY "Admins can view all provider profiles" ON provider_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- PROVIDER DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by_admin_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own documents" ON provider_documents
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all documents" ON provider_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- ADDRESSES
-- =============================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  street_1 TEXT NOT NULL,
  street_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  formatted_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON addresses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create addresses" ON addresses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own addresses" ON addresses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses" ON addresses
  FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- SERVICE AREAS (Provider zones)
-- =============================================
CREATE TABLE IF NOT EXISTS service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  radius_miles INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own service areas" ON service_areas
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Providers can manage own service areas" ON service_areas
  FOR ALL USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

-- =============================================
-- BOOKING REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  yard_size_category TEXT CHECK (yard_size_category IN ('small', 'standard', 'large', 'custom_quote')) DEFAULT 'standard',
  service_frequency TEXT CHECK (service_frequency IN ('one_time', 'weekly', 'biweekly')) DEFAULT 'one_time',
  requested_date DATE,
  requested_time_window TEXT,
  notes TEXT,
  request_type TEXT CHECK (request_type IN ('standard_booking', 'custom_quote')) DEFAULT 'standard_booking',
  status TEXT CHECK (status IN ('pending', 'quoted', 'booked', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own booking requests" ON booking_requests
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers can create booking requests" ON booking_requests
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Admins can view all booking requests" ON booking_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- QUOTE REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'hoa', 'other')) DEFAULT 'residential',
  yard_notes TEXT,
  special_conditions TEXT[],
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'text')) DEFAULT 'email',
  preferred_service_timing TEXT CHECK (preferred_service_timing IN ('asap', 'this_week', 'next_week', 'flexible')) DEFAULT 'flexible',
  status TEXT CHECK (status IN ('submitted', 'under_review', 'quoted', 'approved', 'declined')) DEFAULT 'submitted',
  quoted_price DECIMAL(10,2),
  quoted_by_admin_id UUID REFERENCES users(id),
  quoted_at TIMESTAMP WITH TIME ZONE,
  converted_booking_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can create quote requests" ON quote_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can view own quote requests" ON quote_requests
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins can view all quote requests" ON quote_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update quote requests" ON quote_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- QUOTE REQUEST IMAGES
-- =============================================
CREATE TABLE IF NOT EXISTS quote_request_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE quote_request_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view quote request images" ON quote_request_images
  FOR SELECT USING (true);

CREATE POLICY "Public can create quote request images" ON quote_request_images
  FOR INSERT WITH CHECK (true);

-- =============================================
-- BOOKINGS
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES provider_profiles(id) ON DELETE SET NULL,
  address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE CASCADE,
  yard_size_category TEXT CHECK (yard_size_category IN ('small', 'standard', 'large', 'custom_quote')) DEFAULT 'standard',
  service_type TEXT DEFAULT 'lawn_mowing',
  service_frequency TEXT CHECK (service_frequency IN ('one_time', 'weekly', 'biweekly')) DEFAULT 'one_time',
  scheduled_date DATE,
  scheduled_time_window TEXT,
  estimated_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  provider_payout_amount DECIMAL(10,2),
  payment_status TEXT CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')) DEFAULT 'pending',
  booking_status TEXT CHECK (booking_status IN ('requested', 'booked', 'provider_assigned', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed', 'refunded')) DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings" ON bookings
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Providers can view assigned bookings" ON bookings
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers can create bookings" ON bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Providers can update assigned bookings" ON bookings
  FOR UPDATE USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- BOOKING STATUS EVENTS
-- =============================================
CREATE TABLE IF NOT EXISTS booking_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by_user_id UUID REFERENCES users(id),
  metadata_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE booking_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view booking status events" ON booking_status_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
      AND (customer_id = auth.uid() OR provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()))
    )
  );

CREATE POLICY "Users can create booking status events" ON booking_status_events
  FOR INSERT WITH CHECK (true);

-- =============================================
-- BOOKING ADD-ONS
-- =============================================
CREATE TABLE IF NOT EXISTS booking_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  add_on_type TEXT NOT NULL,
  add_on_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE booking_add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view booking add-ons" ON booking_add_ons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id = booking_id
      AND (customer_id = auth.uid() OR provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid()))
    )
  );

-- =============================================
-- PAYMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded')) DEFAULT 'pending',
  captured_at TIMESTAMP WITH TIME ZONE,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own payments" ON payments
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- PAYOUTS
-- =============================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  stripe_transfer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'cancelled')) DEFAULT 'pending',
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own payouts" ON payouts
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all payouts" ON payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- REVIEWS
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews" ON reviews
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  channel TEXT CHECK (channel IN ('email', 'sms', 'in_app')) DEFAULT 'in_app',
  notification_type TEXT NOT NULL,
  payload_json JSONB,
  delivery_status TEXT CHECK (delivery_status IN ('pending', 'sent', 'failed', 'delivered')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- DISPUTES
-- =============================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  opened_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dispute_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'under_review', 'resolved', 'closed')) DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by_admin_id UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own disputes" ON disputes
  FOR SELECT USING (opened_by_user_id = auth.uid());

CREATE POLICY "Admins can view all disputes" ON disputes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update disputes" ON disputes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- ADMIN ACTIONS (Audit Log)
-- =============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create admin actions" ON admin_actions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to create customer/provider profile on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email, phone, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone', COALESCE(NEW.raw_user_meta_data->>'role', 'customer'))
  ON CONFLICT (id) DO NOTHING;

  -- Create customer profile if role is customer
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'customer' THEN
    INSERT INTO public.customer_profiles (user_id, preferred_contact_method)
    VALUES (NEW.id, 'email')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Create provider profile if role is provider
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'customer') = 'provider' THEN
    INSERT INTO public.provider_profiles (user_id, average_rating, review_count, service_radius_miles, onboarding_status, verification_status, payout_status, is_available)
    VALUES (NEW.id, 0, 0, 10, 'pending', 'pending', 'pending', true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled ON bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user ON provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_service_areas_provider ON service_areas(provider_id);
