// Database types for MowList

export type UserRole = 'customer' | 'provider' | 'admin'

export interface User {
  id: string
  email: string
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerProfile {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  default_address_id: string | null
  preferred_contact_method: 'email' | 'phone' | 'text'
  created_at: string
  updated_at: string
}

export interface ProviderProfile {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  profile_image_url: string | null
  phone_visible: boolean
  average_rating: number
  review_count: number
  service_radius_miles: number
  onboarding_status: 'pending' | 'in_progress' | 'completed'
  verification_status: 'pending' | 'verified' | 'rejected'
  stripe_connect_account_id: string | null
  payout_status: 'pending' | 'active' | 'disabled'
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  user_id: string | null
  street_1: string
  street_2: string | null
  city: string
  state: string
  zip_code: string
  country: string
  latitude: number | null
  longitude: number | null
  formatted_address: string | null
  created_at: string
  updated_at: string
}

export interface ServiceArea {
  id: string
  provider_id: string
  city: string
  state: string
  zip_code: string | null
  radius_miles: number | null
  is_active: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type BookingRequestStatus = 'pending' | 'quoted' | 'booked' | 'cancelled'
export type RequestType = 'standard_booking' | 'custom_quote'

export interface BookingRequest {
  id: string
  customer_id: string
  address_id: string
  yard_size_category: 'small' | 'standard' | 'large' | 'custom_quote'
  service_frequency: 'one_time' | 'weekly' | 'biweekly'
  requested_date: string | null
  requested_time_window: string | null
  notes: string | null
  request_type: RequestType
  status: BookingRequestStatus
  created_at: string
  updated_at: string
}

export type QuoteRequestStatus = 'submitted' | 'under_review' | 'quoted' | 'approved' | 'declined'

export interface QuoteRequest {
  id: string
  customer_id: string | null
  address_id: string
  property_type: 'residential' | 'commercial' | 'hoa' | 'other'
  property_type_other: string | null
  yard_notes: string | null
  special_conditions: string[]
  preferred_contact_method: 'email' | 'phone' | 'text'
  preferred_service_timing: 'asap' | 'this_week' | 'next_week' | 'flexible'
  status: QuoteRequestStatus
  quoted_price: number | null
  quoted_by_admin_id: string | null
  quoted_at: string | null
  converted_booking_id: string | null
  created_at: string
  updated_at: string
}

export interface QuoteRequestImage {
  id: string
  quote_request_id: string
  image_url: string
  created_at: string
}

export type BookingStatus = 'requested' | 'booked' | 'provider_assigned' | 'on_the_way' | 'arrived' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'refunded'
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'

export interface Booking {
  id: string
  booking_request_id: string | null
  quote_request_id: string | null
  customer_id: string
  provider_id: string | null
  address_id: string
  yard_size_category: 'small' | 'standard' | 'large' | 'custom_quote'
  service_type: string
  service_frequency: 'one_time' | 'weekly' | 'biweekly'
  scheduled_date: string | null
  scheduled_time_window: string | null
  estimated_price: number
  final_price: number | null
  platform_fee: number | null
  provider_payout_amount: number | null
  payment_status: PaymentStatus
  booking_status: BookingStatus
  notes: string | null
  before_photo_url: string | null
  after_photo_url: string | null
  before_photo_at: string | null
  after_photo_at: string | null
  pro_lat: number | null
  pro_lng: number | null
  tracking_started_at: string | null
  tracking_ended_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface BookingStatusEvent {
  id: string
  booking_id: string
  status: BookingStatus
  changed_by_user_id: string | null
  metadata_json: Record<string, unknown> | null
  created_at: string
}

export type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed' | 'cancelled'

export interface Payment {
  id: string
  booking_id: string
  customer_id: string
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  captured_at: string | null
  refunded_amount: number
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  provider_id: string
  booking_id: string | null
  stripe_transfer_id: string | null
  amount: number
  currency: string
  status: PayoutStatus
  payout_date: string | null
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  review_text: string | null
  created_at: string
  updated_at: string
}

export type NotificationChannel = 'email' | 'sms' | 'in_app'
export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'delivered'

export interface Notification {
  id: string
  user_id: string
  booking_id: string | null
  channel: NotificationChannel
  notification_type: string
  payload_json: Record<string, unknown>
  delivery_status: NotificationDeliveryStatus
  sent_at: string | null
  created_at: string
}

// Dashboard data types
export interface CustomerDashboardData {
  upcomingBookings: Booking[]
  pastBookings: Booking[]
  savedAddresses: Address[]
}

export interface ProviderDashboardData {
  availableJobs: Booking[]
  scheduledJobs: Booking[]
  completedJobs: Booking[]
  earnings: {
    today: number
    thisWeek: number
    thisMonth: number
    pendingPayout: number
  }
}

export interface AdminDashboardData {
  totalBookings: number
  activeProviders: number
  pendingQuoteRequests: number
  totalRevenue: number
  recentBookings: Booking[]
  pendingProviders: ProviderProfile[]
}
