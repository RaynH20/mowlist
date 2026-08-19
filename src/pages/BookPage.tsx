import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, MapPin, Calendar, CreditCard, Clock, Home, RefreshCw, Star, Shield, Lock, Upload, X, Phone, Mail, MessageSquare, AlertCircle, Plus, Heart } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { createAddress, createBookingRequest, createBooking } from '../lib/api'
import { ADDON_CATALOG, ADDON_BY_ID, calculateAddonTotal, isAddonAvailableFor } from '../lib/addons'
import { geocodeAddress } from '../lib/geocode'
import { getCustomerFavorites, type Favorite } from '../lib/api'

export default function BookPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialZip = searchParams.get('zip') || ''
  const { user, loading: authLoading } = useAuth()

  // State for saved address
  const [savedAddress, setSavedAddress] = useState<{
    id: string
    street_1: string
    city: string
    state: string
    zip_code: string
  } | null>(null)
  const [addressMode, setAddressMode] = useState<'confirm' | 'edit' | 'new'>('confirm')
  const [useExistingAddress, setUseExistingAddress] = useState(false)

  // Favorited pros (shown at top of /book for returning customers)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null)

  // Load saved default address on mount
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!user?.id) return

      try {
        // First get the customer profile to find default_address_id
        const { data: profile } = await supabase
          .from('customer_profiles')
          .select('default_address_id')
          .eq('user_id', user.id)
          .single()

        if (profile?.default_address_id) {
          // Then get the address details
          const { data: address } = await supabase
            .from('addresses')
            .select('id, street_1, city, state, zip_code')
            .eq('id', profile.default_address_id)
            .single()

          if (address) {
            setSavedAddress(address)
            // Pre-fill form with saved address
            setFormData(prev => ({
              ...prev,
              address: address.street_1,
              city: address.city,
              state: address.state,
              zipCode: address.zip_code,
            }))
          }
        }
      } catch (error) {
        console.error('Error loading saved address:', error)
      }
    }

    if (user?.id) {
      loadSavedAddress()
    }
  }, [user?.id])

  // Load customer's favorited pros (for "Use a pro you've used before")
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getCustomerFavorites(user.id).then((res) => {
      if (cancelled) return
      if (!res.error) setFavorites(res.data || [])
    })
    return () => { cancelled = true }
  }, [user?.id])

  // Load customer profile (name + phone) so we can prefill the custom quote contact info
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return
      try {
        const { data } = await supabase
          .from('customer_profiles')
          .select('first_name, last_name, phone')
          .eq('user_id', user.id)
          .maybeSingle()
        if (data) {
          setProfilePrefill({
            firstName: data.first_name || '',
            lastName: data.last_name || '',
            phone: data.phone || '',
          })
          setFormData(prev => ({
            ...prev,
            name: data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : prev.name,
            phone: data.phone || prev.phone,
          }))
        }
      } catch (err) {
        // Non-fatal — just no prefill
      }
    }
    loadProfile()
  }, [user?.id])

  // Additional session check - verify Supabase session is active
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      if (user) {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Supabase session check:', session ? 'Active' : 'None', 'User ID:', user.id)
        if (!session) {
          console.error('No active session despite user being set!')
        }
        setSessionChecked(true)
      }
    }
    checkSession()
  }, [user])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signup/customer', { state: { from: '/book' } })
    }
  }, [user, authLoading, navigate])

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="pt-24 pb-16 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  // Don't render if not logged in (will redirect)
  if (!user) {
    return null
  }

  const [step, setStep] = useState(1)
  const [isCustomQuote, setIsCustomQuote] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Customer profile (prefilled for custom quote contact info)
  const [profilePrefill, setProfilePrefill] = useState<{
    firstName: string
    lastName: string
    phone: string
  }>({ firstName: '', lastName: '', phone: '' })
  // The quote ID returned after the custom quote request is submitted
  const [submittedQuoteId, setSubmittedQuoteId] = useState<string | null>(null)
  // The summary of what was submitted, for the confirmation page
  const [submittedQuoteSummary, setSubmittedQuoteSummary] = useState<{
    propertyType: string
    address: string
    zipCode: string
    contactMethod: string
    contactValue: string
  } | null>(null)
  const [formData, setFormData] = useState({
    address: '',
    zipCode: initialZip,
    city: '',
    state: '',
    lawnSize: 'medium',
    serviceType: 'recurring',
    frequency: 'weekly',
    date: '',
    time: '',
    name: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    phone: '',
    // Special Instructions fields
    specialInstructions: '',
    instructionPhotos: [] as string[],
    instructionTags: [] as string[],
    // Quote-specific fields
    propertyType: 'residential',
    propertyTypeOther: '',
    yardNotes: '',
    specialConditions: [] as string[],
    contactPreference: 'email',
    preferredTiming: 'flexible',
    photos: [] as string[],
    // Add-ons (lawn mowing only — matched against ADDON_CATALOG in src/lib/addons.ts)
    // Each entry: { id, name, price, icon }
    selectedAddons: [] as Array<{ id: string; name: string; price: number; icon: string }>,
  })

  // Add-on service catalog lives in src/lib/addons.ts (shared with ProProfile).
  // Lawn Mowing is the only base service; everything else is an add-on.

  const frequencies = [
    { id: 'one-time', name: 'One-Time', description: 'Single service visit' },
    { id: 'weekly', name: 'Weekly', description: 'Every week - save 10%' },
    { id: 'biweekly', name: 'Bi-Weekly', description: 'Every two weeks - save 5%' },
    { id: 'monthly', name: 'Monthly', description: 'Once per month' },
    { id: 'custom', name: 'Custom Plan', description: 'Let\'s discuss your needs' },
  ]

  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  ]

  const updateForm = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLawnSizeChange = (size: string) => {
    updateForm('lawnSize', size)
    setIsCustomQuote(size === 'custom')
  }

  const toggleSpecialCondition = (condition: string) => {
    setFormData(prev => {
      const conditions = prev.specialConditions.includes(condition)
        ? prev.specialConditions.filter(c => c !== condition)
        : [...prev.specialConditions, condition]
      return { ...prev, specialConditions: conditions }
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // In a real app, you'd upload to a server/cloud storage
      // For now, we'll use placeholder URLs
      const newPhotos = Array.from(files).slice(0, 5 - formData.photos.length).map((_, idx) =>
        `https://picsum.photos/seed/${Date.now() + idx}/400/300`
      )
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos].slice(0, 5) }))
    }
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }))
  }

  const toggleInstructionTag = (tag: string) => {
    setFormData(prev => {
      const tags = prev.instructionTags.includes(tag)
        ? prev.instructionTags.filter(t => t !== tag)
        : [...prev.instructionTags, tag]
      return { ...prev, instructionTags: tags }
    })
  }

  const handleInstructionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newPhotos = Array.from(files).slice(0, 5 - formData.instructionPhotos.length).map((_, idx) =>
        `https://picsum.photos/seed/${Date.now() + idx}/400/300`
      )
      setFormData(prev => ({ ...prev, instructionPhotos: [...prev.instructionPhotos, ...newPhotos].slice(0, 5) }))
    }
  }

  const removeInstructionPhoto = (index: number) => {
    setFormData(prev => ({ ...prev, instructionPhotos: prev.instructionPhotos.filter((_, i) => i !== index) }))
  }

  // Unified property tags — used for BOTH regular bookings (instructions for the pro)
  // AND custom quotes (conditions that affect pricing). Single source of truth so the
  // customer sees the same options regardless of which flow they're in.
  const propertyTagOptions = [
    { id: 'pets', label: 'Pets on property', icon: '🐶' },
    { id: 'locked_gate', label: 'Locked gate', icon: '🔒' },
    { id: 'hills_slopes', label: 'Steep slopes / hills', icon: '⛰️' },
    { id: 'overgrown_grass', label: 'Overgrown / tall grass', icon: '🌱' },
    { id: 'water_features', label: 'Water features', icon: '💧' },
    { id: 'fragile', label: 'Fragile landscaping', icon: '🌷' },
    { id: 'obstacles', label: 'Obstacles to avoid', icon: '⚠️' },
    { id: 'call_first', label: 'Call before arriving', icon: '📞' },
  ]

  const nextStep = () => {
    // For custom quote, skip schedule and payment steps
    if (isCustomQuote && step === 2) {
      setStep(5) // Go to quote form (we'll renumber steps)
    } else if (isCustomQuote && step === 5) {
      setStep(8) // Skip to quote confirmation
    } else {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    // For custom quote, go back from quote form to service selection
    if (isCustomQuote && step === 5) {
      setStep(2)
    } else {
      setStep(step - 1)
    }
  }

  const calculatePrice = () => {
    // Lawn size base (with frequency discount applied to base, not addons)
    let base = formData.lawnSize === 'small' ? 35 : formData.lawnSize === 'medium' ? 45 : formData.lawnSize === 'large' ? 65 : 0
    if (formData.frequency === 'weekly') base = base * 0.9
    if (formData.frequency === 'biweekly') base = base * 0.95
    const baseRounded = Math.round(base)
    // Add-ons are full price (no discount on addons, even for recurring)
    const addonTotal = calculateAddonTotal(formData.selectedAddons)
    return baseRounded + addonTotal
  }

  // Map form-friendly values to schema enum values
  // The form uses 'medium' / 'one-time' for UX, but the DB CHECK constraints
  // expect 'standard' / 'one_time'
  const mapYardSizeToSchema = (size: string): 'small' | 'standard' | 'large' | 'custom_quote' => {
    if (size === 'medium') return 'standard'
    if (size === 'custom') return 'custom_quote'
    return size as 'small' | 'standard' | 'large' | 'custom_quote'
  }

  const mapFrequencyToSchema = (freq: string): 'one_time' | 'weekly' | 'biweekly' => {
    if (freq === 'one-time' || freq === 'monthly' || freq === 'custom') return 'one_time'
    return freq as 'one_time' | 'weekly' | 'biweekly'
  }

  const handleSubmitBooking = async () => {
    setLoading(true)
    setError(null)

    try {
      // User is already verified via auth context at component mount
      // The component won't render if user is null (redirects to signup)
      if (!user || !user.id) {
        throw new Error('Please sign in to complete your booking')
      }

      console.log('Creating booking for user:', user.id)

      // Validate required fields
      if (!formData.address || !formData.address.trim()) {
        throw new Error('Please enter your street address')
      }
      if (!formData.zipCode || !formData.zipCode.trim()) {
        throw new Error('Please enter your zip code')
      }

      // Determine which address to use
      let addressId: string

      // If user has saved address and is using it, use that
      if (savedAddress && useExistingAddress) {
        addressId = savedAddress.id
        console.log('Using saved address:', savedAddress.id)
      } else {
        // Check if address already exists with same details
        const { data: existingAddress } = await supabase
          .from('addresses')
          .select('id')
          .eq('user_id', user.id)
          .eq('street_1', formData.address)
          .eq('zip_code', formData.zipCode)
          .single()

        if (existingAddress) {
          // Use existing address
          addressId = existingAddress.id
          console.log('Using existing address:', addressId)
        } else {
          // Geocode the address (for live tracking + geofence checks).
          // We try to geocode, but if it fails we still create the address —
          // better to let the booking proceed than block on a third-party API.
          const geocoded = await geocodeAddress(
            formData.address,
            formData.city || '',
            formData.state || '',
            formData.zipCode
          )

          // Create new address (with lat/lng if geocoding succeeded)
          const { data: address, error: addressError } = await createAddress({
            user_id: user.id,
            street_1: formData.address,
            zip_code: formData.zipCode,
            city: formData.city || 'Unknown',
            state: formData.state || 'Unknown',
            country: 'USA',
            latitude: geocoded?.latitude ?? null,
            longitude: geocoded?.longitude ?? null,
            geocoded_at: geocoded ? new Date().toISOString() : null,
            geocode_source: geocoded?.source ?? null,
          } as any)

          if (addressError) {
            console.error('Address save error details:', addressError)
            throw new Error(`Failed to save address: ${addressError.message}`)
          }

          if (!address) {
            throw new Error('Failed to create address record')
          }

          addressId = address.id
          console.log('Address created successfully:', addressId)
        }
      }

      if (isCustomQuote) {
        // Create quote request
        const { data: quote, error: quoteError } = await createQuoteRequest({
          customer_id: user.id,
          address_id: addressId,
          property_type: formData.propertyType as any,
          property_type_other: formData.propertyType === 'other' ? formData.propertyTypeOther : null,
          yard_notes: formData.yardNotes,
          special_conditions: formData.specialConditions,
          preferred_contact_method: formData.contactPreference as any,
          preferred_service_timing: formData.preferredTiming as any,
          status: 'submitted',
        })

        if (quoteError) {
          throw new Error('Failed to submit quote request')
        }

        // Save the quote ID and a summary so the confirmation page can show them
        setSubmittedQuoteId(quote?.id || null)
        setSubmittedQuoteSummary({
          propertyType:
            formData.propertyType === 'other' && formData.propertyTypeOther
              ? formData.propertyTypeOther
              : formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1),
          address: formData.address,
          zipCode: formData.zipCode,
          contactMethod: formData.contactPreference,
          contactValue:
            formData.contactPreference === 'email' ? formData.email :
            formData.contactPreference === 'phone' || formData.contactPreference === 'text' ? formData.phone :
            formData.email,
        })

        // Also update the customer profile with the name/phone they provided
        // (only if not already set) — this prefill persists for next time
        if (profilePrefill.firstName === '' && formData.name) {
          const [first, ...rest] = formData.name.split(' ')
          await supabase
            .from('customer_profiles')
            .update({
              first_name: first || null,
              last_name: rest.join(' ') || null,
              phone: formData.phone || null,
            })
            .eq('user_id', user.id)
        }
      } else {
        // Create booking request
        const { error: bookingError } = await createBookingRequest({
          customer_id: user.id,
          address_id: addressId,
          yard_size_category: mapYardSizeToSchema(formData.lawnSize),
          service_frequency: mapFrequencyToSchema(formData.frequency),
          requested_date: formData.date || null,
          requested_time_window: formData.time || null,
          request_type: isCustomQuote ? 'custom_quote' : 'standard_booking',
          status: 'pending',
        })

        if (bookingError) {
          throw new Error('Failed to create booking request')
        }

        // Create the booking with status 'requested' — we'll wait for a pro
        // to accept before the customer pays (so the payment can be routed
        // directly to the pro's Stripe Connect account).
        //
        // If the customer picked a favorite pro at the top, pre-assign them
        // so the booking goes directly to that pro (skipping the marketplace).
        // Status becomes 'provider_assigned' instead of 'requested' so the
        // pro sees it as a returning customer request.
        let assignedProviderId: string | null = null
        if (selectedFavoriteId) {
          // Look up the pro's provider_profiles.id from the public id
          const { data: provider } = await supabase
            .from('provider_profiles')
            .select('id')
            .eq('id', selectedFavoriteId)
            .maybeSingle()
          assignedProviderId = provider?.id || null
        }

        const { data: newBooking, error: bookingCreateError } = await createBooking({
          customer_id: user.id,
          address_id: addressId,
          yard_size_category: mapYardSizeToSchema(formData.lawnSize),
          service_type: 'lawn_mowing',
          service_frequency: mapFrequencyToSchema(formData.frequency),
          scheduled_date: formData.date || null,
          scheduled_time_window: formData.time || null,
          estimated_price: calculatePrice(),
          booking_status: assignedProviderId ? 'provider_assigned' : 'requested',
          payment_status: 'pending',
          selected_addons: formData.selectedAddons,
          provider_id: assignedProviderId,  // null for marketplace, set for favorite
        } as any)

        if (bookingCreateError || !newBooking) {
          throw new Error('Failed to create booking')
        }

        // Navigate to the "waiting for pro" page which polls for status and
        // shows a Pay Now button once a pro accepts
        navigate(`/booking-pending/${newBooking.id}`)
        return
      }

      // Custom quote confirmation (the standard booking branch above already
      // navigated to the pending page and returned)
      setStep(8)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Dynamic steps based on flow type. The custom quote flow has only 4 steps
  // (Address → Service → Details → Confirm) but the actual state `step` skips
  // around (1, 2, 5, 8) because the same component also handles the regular
  // booking flow (1-7). So we map both: a "display number" for the progress
  // bar, and the "real step" used in the component for rendering.
  const getSteps = () => {
    if (isCustomQuote) {
      return [
        { number: 1, title: 'Address', realStep: 1 },
        { number: 2, title: 'Service', realStep: 2 },
        { number: 3, title: 'Details', realStep: 5 },
        { number: 4, title: 'Confirm', realStep: 8 },
      ]
    }
    return [
      { number: 1, title: 'Address', realStep: 1 },
      { number: 2, title: 'Service', realStep: 2 },
      { number: 3, title: 'Schedule', realStep: 3 },
      { number: 4, title: 'Instructions', realStep: 4 },
      { number: 5, title: 'Account', realStep: 5 },
      { number: 6, title: 'Review', realStep: 6 },
      { number: 7, title: 'Confirm', realStep: 7 },
    ]
  }

  const steps = getSteps()

  // Current display step: find the step whose realStep matches the current state
  const currentDisplayStep = steps.find((s) => s.realStep === step)?.number || 1

  return (
    <div className="pt-20 pb-12 bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        {/* Progress Steps - Compact mobile */}
        <div className="mb-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((s, index) => {
              const currentStepNum = currentDisplayStep
              return (
                <div key={s.number} className="flex items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                      currentStepNum >= s.number
                        ? 'bg-[#22C55E] text-white shadow-md shadow-green-200'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {currentStepNum > s.number ? <Check size={14} /> : s.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 rounded-full transition-all ${
                        currentStepNum > s.number ? 'bg-[#22C55E]' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 overflow-x-auto px-1">
            {steps.map((s) => {
              const currentStepNum = currentDisplayStep
              return (
                <span
                  key={s.number}
                  className={`text-xs flex-shrink-0 ${
                    currentStepNum >= s.number ? 'text-[#22C55E] font-semibold' : 'text-slate-400'
                  }`}
                >
                  {s.title}
                </span>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6">
          {/* Favorited pros — show at top of step 1 (only if any exist) */}
          {step === 1 && favorites.length > 0 && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <Heart size={16} className="fill-red-500 text-red-500" />
                <h3 className="text-sm font-semibold text-slate-900">Use a pro you've used before</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Pick a saved pro to skip the marketplace. They get first dibs.
              </p>
              <div className="space-y-2">
                {favorites.slice(0, 3).map((fav) => {
                  const p = (fav as any).provider
                  if (!p) return null
                  const isSelected = selectedFavoriteId === p.id
                  return (
                    <button
                      key={fav.id}
                      onClick={() => {
                        // Toggle: if already selected, clear; otherwise set
                        setSelectedFavoriteId(isSelected ? null : p.id)
                      }}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#22C55E] bg-green-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      {p.profile_image_url ? (
                        <img src={p.profile_image_url} alt={p.display_name || 'Pro'} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22C55E] to-[#1E40AF] text-white font-semibold flex items-center justify-center text-sm flex-shrink-0">
                          {(p.display_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {p.display_name || 'Pro'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="text-amber-500">★</span>
                          <span>{p.average_rating ? Number(p.average_rating).toFixed(1) : 'New'}</span>
                          {p.review_count > 0 && <span>({p.review_count})</span>}
                        </div>
                      </div>
                      <span className={`text-xs font-medium flex-shrink-0 ${
                        isSelected ? 'text-[#22C55E]' : 'text-slate-400'
                      }`}>
                        {isSelected ? '✓ Selected' : 'Use'}
                      </span>
                    </button>
                  )
                })}
                <button
                  onClick={() => setSelectedFavoriteId(null)}
                  className={`w-full text-left p-2 rounded-lg text-xs text-center transition-colors ${
                    selectedFavoriteId === null
                      ? 'bg-slate-100 text-slate-700 font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Or find a new pro in the marketplace
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Address - Show confirmation if saved address exists */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Service Address</h2>
              <p className="text-sm text-slate-500 mb-4">Where should we provide service?</p>

              {/* Show saved address confirmation if available */}
              {savedAddress && addressMode === 'confirm' && (
                <div className="mb-4">
                  <div className="p-4 bg-green-50 border-2 border-[#22C55E] rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={14} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">Use my saved address</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {savedAddress.street_1}<br />
                          {savedAddress.city}, {savedAddress.state} {savedAddress.zip_code}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        // Use saved address, set flag and proceed
                        setUseExistingAddress(true)
                        setFormData(prev => ({
                          ...prev,
                          address: savedAddress.street_1,
                          city: savedAddress.city,
                          state: savedAddress.state,
                          zipCode: savedAddress.zip_code,
                        }))
                      }}
                      className="flex-1 bg-[#22C55E] text-white py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
                    >
                      Confirm & Continue
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setUseExistingAddress(false)
                      setAddressMode('edit')
                    }}
                    className="w-full mt-2 text-[#22C55E] text-sm font-medium hover:underline"
                  >
                    Edit this address
                  </button>
                  <button
                    onClick={() => {
                      setUseExistingAddress(false)
                      setAddressMode('new')
                    }}
                    className="w-full mt-1 text-slate-500 text-sm hover:text-slate-700"
                  >
                    Use a different address
                  </button>
                </div>
              )}

              {/* Address form when editing or new */}
              {(addressMode === 'edit' || addressMode === 'new' || !savedAddress) && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateForm('address', e.target.value)}
                        placeholder="123 Main Street"
                        className="w-full pl-10 pr-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateForm('city', e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => updateForm('state', e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Zip Code</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => updateForm('zipCode', e.target.value)}
                        placeholder="12345"
                        className="w-full pl-10 pr-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Back to saved address option */}
                  {savedAddress && addressMode !== 'new' && (
                    <button
                      onClick={() => {
                        setAddressMode('confirm')
                        setFormData(prev => ({
                          ...prev,
                          address: savedAddress.street_1,
                          city: savedAddress.city,
                          state: savedAddress.state,
                          zipCode: savedAddress.zip_code,
                        }))
                      }}
                      className="text-slate-500 text-sm hover:text-slate-700"
                    >
                      ← Use saved address instead
                    </button>
                  )}
                </div>
              )}

              {/* Yard Size - Always show */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Yard Size</label>
                <div className="space-y-2">
                  {[
                    { id: 'small', name: 'Small', subtitle: '~2,500 sq ft', sqft: 'Townhomes' },
                    { id: 'medium', name: 'Medium', subtitle: '2,500-6,000 sq ft', sqft: 'Typical homes' },
                    { id: 'large', name: 'Large', subtitle: '6,000-12,000 sq ft', sqft: 'Big properties' },
                    { id: 'custom', name: 'Custom Quote', subtitle: 'Over 12,000 sq ft', sqft: 'Oversized', isCustom: true },
                  ].map((size) => (
                    <button
                      key={size.id}
                      onClick={() => handleLawnSizeChange(size.id)}
                      className={`w-full p-3 border-2 rounded-lg transition-all text-left flex items-center gap-3 ${
                        formData.lawnSize === size.id
                          ? 'border-[#22C55E] bg-green-50'
                          : 'border-slate-200 hover:border-[#22C55E]/50'
                      } ${(size as any).isCustom ? '' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        formData.lawnSize === size.id ? 'border-[#22C55E] bg-[#22C55E]' : 'border-slate-300'
                      }`}>
                        {formData.lawnSize === size.id && <Check size={12} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 text-sm">{size.name}</div>
                        <div className="text-xs text-slate-500">{size.subtitle} - {size.sqft}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  * Final price confirmed after review
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Service */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Choose Your Service</h2>
              <p className="text-sm text-slate-500 mb-4">Select one-time or recurring service</p>

              <div className="space-y-2 mb-4">
                {frequencies.map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => {
                      updateForm('serviceType', freq.id === 'one-time' ? 'one-time' : 'recurring')
                      updateForm('frequency', freq.id)
                    }}
                    className={`w-full p-3 border-2 rounded-lg transition-all flex items-center gap-3 ${
                      formData.frequency === freq.id
                        ? 'border-[#22C55E] bg-green-50'
                        : 'border-slate-200 hover:border-[#22C55E]/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.frequency === freq.id ? 'border-[#22C55E] bg-[#22C55E]' : 'border-slate-300'
                    }`}>
                      {formData.frequency === freq.id && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{freq.name}</div>
                      <div className="text-xs text-slate-500">{freq.description}</div>
                    </div>
                    {freq.id !== 'one-time' && <RefreshCw className="text-[#22C55E]" size={18} />}
                  </button>
                ))}
              </div>
              {isCustomQuote || formData.frequency === 'custom' ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-slate-700 font-medium text-sm">Custom Quote</span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        We'll confirm pricing before booking
                      </p>
                    </div>
                    <span className="text-lg font-bold text-[#1E40AF]">Quote</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-700 font-medium text-sm">Estimated Price:</span>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">ESTIMATED</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formData.frequency === 'one-time'
                          ? 'Pay after service'
                          : formData.frequency === 'weekly'
                            ? '10% discount applied'
                            : formData.frequency === 'biweekly'
                              ? '5% discount applied'
                              : formData.frequency === 'monthly'
                                ? 'Monthly service'
                                : ''}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-[#22C55E]">${calculatePrice()}</span>
                  </div>

                  {/* Show recurring total for recurring services */}
                  {formData.frequency !== 'one-time' && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {formData.frequency === 'weekly'
                              ? 'Weekly total:'
                              : formData.frequency === 'biweekly'
                                ? 'Bi-weekly total:'
                                : 'Monthly total:'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formData.frequency === 'weekly'
                              ? `${calculatePrice()} × 4 visits`
                              : formData.frequency === 'biweekly'
                                ? `${calculatePrice()} × 2 visits`
                                : `${calculatePrice()} × 1 visit`}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-[#1E40AF]">
                          ${formData.frequency === 'weekly'
                            ? calculatePrice() * 4
                            : formData.frequency === 'biweekly'
                              ? calculatePrice() * 2
                              : calculatePrice()}
                          /{formData.frequency === 'biweekly' ? 'mo' : 'mo'}
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-green-100">
                    * Final price may vary after on-site assessment
                  </p>
                </div>
              )}

              {/* ============ ADD-ONS (Lawn Mowing only) ============ */}
              {!isCustomQuote && formData.frequency !== 'custom' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Add extras (optional)</p>
                      <p className="text-xs text-slate-500">Bundle with your mow to save a separate trip</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formData.selectedAddons.length > 0
                        ? `${formData.selectedAddons.length} added`
                        : 'Skip →'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {ADDON_CATALOG.map((addon) => {
                      const isSelected = formData.selectedAddons.some((a) => a.id === addon.id)
                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              updateForm('selectedAddons', formData.selectedAddons.filter((a) => a.id !== addon.id))
                            } else {
                              updateForm('selectedAddons', [...formData.selectedAddons, {
                                id: addon.id,
                                name: addon.name,
                                price: addon.price,
                                icon: addon.icon,
                              }])
                            }
                          }}
                          className={`p-2.5 border-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? 'border-[#22C55E] bg-green-50'
                              : 'border-slate-200 hover:border-[#22C55E]/50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected ? 'border-[#22C55E] bg-[#22C55E]' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{addon.icon}</span>
                                <p className="font-medium text-slate-900 text-xs truncate">{addon.name}</p>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">+${addon.price}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {formData.selectedAddons.length > 0 && (
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                      <span className="text-xs text-blue-700">
                        Add-ons: {formData.selectedAddons.map((a) => a.name).join(', ')}
                      </span>
                      <span className="text-xs font-semibold text-blue-700">
                        +${calculateAddonTotal(formData.selectedAddons)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Pick a Time</h2>
              <p className="text-sm text-slate-500 mb-4">Choose your preferred date and time</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateForm('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Time Window
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => updateForm('time', time)}
                        className={`p-2.5 border-2 rounded-lg text-sm font-medium transition-all ${
                          formData.time === time
                            ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                            : 'border-slate-200 hover:border-[#22C55E]/50 text-slate-600'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Special Instructions */}
          {step === 4 && !isCustomQuote && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Special Instructions</h2>
              <p className="text-sm text-slate-500 mb-4">Help your lawn pro prepare for the visit</p>

              <div className="space-y-5">
                {/* Quick Tags */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Quick Tags <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {propertyTagOptions.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleInstructionTag(tag.id)}
                        className={`p-3 border-2 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2 ${
                          formData.instructionTags.includes(tag.id)
                            ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                            : 'border-slate-200 hover:border-[#22C55E]/50 text-slate-600'
                        }`}
                      >
                        <span className="text-lg">{tag.icon}</span>
                        <span>{tag.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Instructions Text */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Notes for Your Lawn Pro <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={formData.specialInstructions}
                    onChange={(e) => updateForm('specialInstructions', e.target.value)}
                    placeholder="Gate code is 1234. Please watch out for the sprinklers near the driveway. Backyard access is through the side gate..."
                    rows={4}
                    className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Examples: gate codes, obstacles, access notes</span>
                    <span className="text-xs text-slate-400">{formData.specialInstructions.length}/500</span>
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Upload Photos <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Share photos of obstacles, gate access, or areas to avoid</p>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-[#22C55E]/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleInstructionPhotoUpload}
                      className="hidden"
                      id="instruction-photo-upload"
                      disabled={formData.instructionPhotos.length >= 5}
                    />
                    <label htmlFor="instruction-photo-upload" className="cursor-pointer">
                      <Upload className="mx-auto text-slate-400 mb-2" size={28} />
                      <p className="text-sm text-slate-500">Click to upload photos</p>
                      <p className="text-xs text-slate-400 mt-1">Max 5 photos, 5MB each</p>
                    </label>
                  </div>
                  {formData.instructionPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.instructionPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img src={photo} alt={`Upload ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => removeInstructionPhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <Shield className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Why add special instructions?</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Help your lawn pro provide better service by warning them about obstacles, pets, gate codes, or areas that need extra care.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Account (for regular booking) */}
          {step === 5 && !isCustomQuote && (
            <div>
              {user ? (
                // Logged-in user: show account info and skip to payment
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Confirm Your Account</h2>
                  <p className="text-sm text-slate-500 mb-4">Booking confirmation will be sent to your email</p>

                  <div className="p-4 bg-green-50 border-2 border-[#22C55E] rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={14} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Logged in as:</p>
                        <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-4">
                    Your booking will be associated with your account. You can manage your bookings from the dashboard.
                  </p>
                </div>
              ) : (
                // Not logged in: show create account form (this should rarely happen since we redirect)
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Create Your Account</h2>
                  <p className="text-sm text-slate-500 mb-4">We'll send booking confirmations here</p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => updateForm('name', e.target.value)}
                          placeholder="John"
                          className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateForm('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Quote Request Form (for Custom Quote) */}
          {step === 5 && isCustomQuote && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Details</h2>
              <p className="text-slate-500 mb-6">Tell us more about your property so we can provide an accurate quote</p>

              <div className="space-y-5">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type</label>
                  <select
                    value={formData.propertyType}
                    onChange={(e) => updateForm('propertyType', e.target.value)}
                    className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="hoa">HOA / Community</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* "Other" description */}
                {formData.propertyType === 'other' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tell us more about your property
                    </label>
                    <input
                      type="text"
                      value={formData.propertyTypeOther}
                      onChange={(e) => updateForm('propertyTypeOther', e.target.value)}
                      placeholder="e.g. Multi-family complex, school campus, church grounds..."
                      className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                )}

                {/* Yard Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Yard / Property Notes</label>
                  <textarea
                    value={formData.yardNotes}
                    onChange={(e) => updateForm('yardNotes', e.target.value)}
                    placeholder="Describe your yard, any obstacles, access issues, or special requirements..."
                    rows={4}
                    className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Property Tags (unified with regular booking) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Property Notes (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {propertyTagOptions.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleSpecialCondition(tag.id)}
                        className={`p-3 border-2 rounded-xl text-sm font-medium transition-all text-left flex items-center gap-2 ${
                          formData.specialConditions.includes(tag.id)
                            ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                            : 'border-slate-200 hover:border-[#22C55E]/50 text-slate-600'
                        }`}
                      >
                        <span className="text-lg">{tag.icon}</span>
                        <span>{tag.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Photos (Optional)</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-[#22C55E]/50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                      disabled={formData.photos.length >= 5}
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                      <p className="text-sm text-slate-500">Click to upload photos</p>
                      <p className="text-xs text-slate-400 mt-1">Max 5 photos, 5MB each</p>
                    </label>
                  </div>
                  {formData.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img src={photo} alt={`Upload ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Preference */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Preferred Contact Method</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateForm('contactPreference', 'email')}
                      className={`flex-1 p-4 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        formData.contactPreference === 'email'
                          ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                          : 'border-slate-200 hover:border-[#22C55E]/50'
                      }`}
                    >
                      <Mail size={20} />
                      <span className="font-medium">Email</span>
                    </button>
                    <button
                      onClick={() => updateForm('contactPreference', 'phone')}
                      className={`flex-1 p-4 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        formData.contactPreference === 'phone'
                          ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                          : 'border-slate-200 hover:border-[#22C55E]/50'
                      }`}
                    >
                      <Phone size={20} />
                      <span className="font-medium">Phone</span>
                    </button>
                    <button
                      onClick={() => updateForm('contactPreference', 'text')}
                      className={`flex-1 p-4 border-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                        formData.contactPreference === 'text'
                          ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                          : 'border-slate-200 hover:border-[#22C55E]/50'
                      }`}
                    >
                      <MessageSquare size={20} />
                      <span className="font-medium">Text</span>
                    </button>
                  </div>
                </div>

                {/* Preferred Timing */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Service Timing</label>
                  <select
                    value={formData.preferredTiming}
                    onChange={(e) => updateForm('preferredTiming', e.target.value)}
                    className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value="asap">ASAP / Urgent</option>
                    <option value="this_week">This Week</option>
                    <option value="next_week">Next Week</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                {/* Ballpark pricing note */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-900 font-medium">Typical pricing</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Properties over 12,000 sq ft typically run <strong>$80 – $150+ per visit</strong>,
                    depending on terrain, access, and frequency. We'll confirm exact pricing in your quote.
                  </p>
                </div>

                {/* Contact Info — name, email, phone, edit inline */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Your Contact Info</label>
                  <p className="text-xs text-slate-500 mb-3">
                    We use this to send you the quote. You can edit any of it before submitting.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Phone <span className="text-slate-400 font-normal">(only needed if you chose phone or text)</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateForm('phone', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review (was the dummy "Payment" step — payment is collected on /checkout) */}
          {step === 6 && !isCustomQuote && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Review &amp; Continue to Payment</h2>
              <p className="text-sm text-slate-500 mb-4">Looks good? You'll enter payment on the next screen.</p>

              {/* Order summary */}
              <div className="bg-slate-50 rounded-lg border border-slate-100 divide-y divide-slate-200">
                <div className="p-3 flex justify-between text-sm">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-900">
                    {formData.lawnSize === 'small' ? 'Small Yard'
                      : formData.lawnSize === 'medium' ? 'Medium Yard'
                      : formData.lawnSize === 'large' ? 'Large Yard'
                      : 'Custom'} — {formData.frequency || 'one-time'}
                  </span>
                </div>
                <div className="p-3 flex justify-between text-sm">
                  <span className="text-slate-500">When</span>
                  <span className="font-medium text-slate-900">
                    {formData.date || 'TBD'}{formData.time ? ` at ${formData.time}` : ''}
                  </span>
                </div>
                <div className="p-3 flex justify-between text-sm">
                  <span className="text-slate-500">Address</span>
                  <span className="font-medium text-slate-900 text-right">
                    {formData.address || '—'}{formData.zipCode ? `, ${formData.zipCode}` : ''}
                  </span>
                </div>
                <div className="p-3 flex justify-between text-sm">
                  <span className="text-slate-500">Service fee</span>
                  <span className="font-medium text-slate-900">$2.99</span>
                </div>
                {formData.selectedAddons.length > 0 && (
                  <div className="p-3 flex justify-between text-sm">
                    <span className="text-slate-500">Add-ons</span>
                    <span className="font-medium text-slate-900 text-right">
                      {formData.selectedAddons.map(a => `${a.icon} ${a.name}`).join(', ')}
                    </span>
                  </div>
                )}
                <div className="p-3 flex justify-between items-center">
                  <span className="font-semibold text-slate-900">Total today</span>
                  <span className="font-bold text-lg text-[#22C55E]">
                    {formData.lawnSize === 'custom' ? 'Custom Quote' : `$${calculatePrice()}`}
                  </span>
                </div>
              </div>

              {/* Payment method hint */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <CreditCard className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Payment happens next</p>
                  <p className="text-blue-700 text-xs mt-0.5">
                    You'll be taken to a secure Stripe checkout. You can use a saved card or enter a new one. Cards can be saved for one-click checkout next time.
                  </p>
                </div>
              </div>

              {/* Trust badges row */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock size={12} className="text-[#22C55E]" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Shield size={12} className="text-[#22C55E]" />
                  <span>PCI Compliant</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CreditCard size={12} className="text-[#22C55E]" />
                  <span>Stripe</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Payment is held until your pro finishes the job.
              </p>
            </div>
          )}

          {/* Step 7: Confirmation (was step 6, now step 7 for regular booking) */}
          {step === 7 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
                <Check size={40} className="text-[#22C55E]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
              <p className="text-slate-600 mb-8">Your lawn service has been scheduled. Check your email for details.</p>

              <div className="bg-slate-50 rounded-xl p-6 text-left mb-8 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Address</span>
                    <span className="font-medium text-slate-900">{formData.address}, {formData.zipCode}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Service</span>
                    <span className="font-medium text-slate-900 capitalize">{formData.frequency} Lawn Mowing</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Scheduled</span>
                    <span className="font-medium text-slate-900">{formData.date} at {formData.time}</span>
                  </div>

                  {/* Special Instructions Summary */}
                  {(formData.instructionTags.length > 0 || formData.specialInstructions || formData.instructionPhotos.length > 0) && (
                    <div className="py-2 border-b border-slate-200">
                      <span className="text-slate-500 block mb-2">Special Instructions</span>
                      {formData.instructionTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {formData.instructionTags.map(tag => {
                            const tagOption = propertyTagOptions.find(t => t.id === tag)
                            return (
                              <span key={tag} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                                {tagOption?.icon} {tagOption?.label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      {formData.specialInstructions && (
                        <p className="text-slate-700 text-xs italic mb-2">{formData.specialInstructions}</p>
                      )}
                      {formData.instructionPhotos.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {formData.instructionPhotos.map((photo, idx) => (
                            <img key={idx} src={photo} alt={`Instruction ${idx + 1}`} className="w-12 h-12 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-3">
                    <span className="font-semibold text-slate-900">Amount</span>
                    <span className="font-bold text-xl text-[#22C55E]">
                      {formData.lawnSize === 'custom' ? 'Custom Quote' : `$${calculatePrice()}`}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard"
                className="inline-block bg-[#22C55E] text-white px-10 py-4 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors shadow-lg shadow-green-200"
              >
                View My Bookings
              </Link>
            </div>
          )}

          {/* Step 8: Quote Confirmation (for Custom Quote) - was step 7 */}
          {step === 8 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                <Check size={40} className="text-[#1E40AF]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Quote Request Submitted!</h2>
              <p className="text-slate-600 mb-6">Thanks! We'll review your property and send pricing your way.</p>

              {/* Quote ID — real, from the database */}
              {submittedQuoteId && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1E40AF] to-blue-700 text-white px-5 py-2.5 rounded-full mb-6 shadow-md">
                  <span className="text-white/80 text-xs uppercase tracking-wide">Quote ID</span>
                  <span className="font-mono font-bold text-lg">#{submittedQuoteId.slice(-8).toUpperCase()}</span>
                </div>
              )}

              {/* Summary of what was submitted */}
              <div className="bg-slate-50 rounded-xl p-6 text-left mb-6 border border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4">Your Submission</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-200 gap-3">
                    <span className="text-slate-500 flex-shrink-0">Address</span>
                    <span className="font-medium text-slate-900 text-right">
                      {submittedQuoteSummary?.address || formData.address}
                      {submittedQuoteSummary?.zipCode || formData.zipCode}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Property Type</span>
                    <span className="font-medium text-slate-900">
                      {submittedQuoteSummary?.propertyType || formData.propertyType}
                    </span>
                  </div>
                  {formData.specialConditions.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-500">Special Conditions</span>
                      <span className="font-medium text-slate-900 text-right capitalize">
                        {formData.specialConditions.join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-slate-200">
                    <span className="text-slate-500">Preferred Timing</span>
                    <span className="font-medium text-slate-900 capitalize">
                      {formData.preferredTiming.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">We'll reach out via</span>
                    <span className="font-medium text-slate-900 text-right">
                      {formData.contactPreference.charAt(0).toUpperCase() + formData.contactPreference.slice(1)}
                      <br />
                      <span className="text-xs text-slate-500 font-normal">
                        {formData.contactPreference === 'email' ? formData.email : formData.phone}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline: what happens next */}
              <div className="bg-white rounded-xl border border-slate-100 p-6 text-left mb-6">
                <h3 className="font-semibold text-slate-900 mb-4">What happens next</h3>
                <div className="relative pl-6">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-[#22C55E] -ml-1 mt-0.5 z-10 ring-4 ring-green-100"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Request submitted</p>
                        <p className="text-xs text-slate-500">Just now</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-slate-200 -ml-1 mt-0.5 z-10"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Under review</p>
                        <p className="text-xs text-slate-400">Our team reviews your property details</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-slate-200 -ml-1 mt-0.5 z-10"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Quote sent</p>
                        <p className="text-xs text-slate-400">Within 24-48 hours, via {formData.contactPreference}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 relative">
                      <div className="w-4 h-4 rounded-full bg-slate-200 -ml-1 mt-0.5 z-10"></div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Approve & book</p>
                        <p className="text-xs text-slate-400">Accept the quote and we schedule your first visit</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/dashboard/services"
                  className="inline-block bg-[#22C55E] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors shadow-lg shadow-green-200"
                >
                  View My Quotes
                </Link>
                <Link
                  to="/book"
                  className="inline-block bg-white border border-slate-300 text-slate-700 px-8 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    // Reset for a fresh booking
                    setStep(1)
                    setIsCustomQuote(false)
                    setSubmittedQuoteId(null)
                    setSubmittedQuoteSummary(null)
                  }}
                >
                  Book Another Service
                </Link>
              </div>
            </div>
          )}

          {/* Navigation - Mobile optimized */}
          {((!isCustomQuote && step < 7) || (isCustomQuote && step < 8)) && (
            <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Back
              </button>
              <button
                onClick={() => {
                  // Check if this is the final step before submitting
                  if ((!isCustomQuote && step === 6) || (isCustomQuote && step === 5)) {
                    handleSubmitBooking()
                  } else {
                    nextStep()
                  }
                }}
                disabled={
                  loading ||
                  (step === 1 && (!formData.address || !formData.zipCode)) ||
                  (step === 3 && !isCustomQuote && (!formData.date || !formData.time)) ||
                  // For step 5, only require name/email/phone if user is NOT logged in
                  (step === 5 && !isCustomQuote && !user && (!formData.name || !formData.email || !formData.phone))
                }
                className="bg-[#22C55E] text-white px-8 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#16A34A] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none inline-flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    {isCustomQuote && step === 2 ? 'Request Quote' : step === 6 && !isCustomQuote ? 'Confirm Booking' : 'Continue'} <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                {!user && step >= 4 && (
                  <Link to="/signup" className="text-sm text-[#22C55E] hover:underline mt-1 inline-block">
                    Sign up to complete your booking
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
