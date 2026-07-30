import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { ChevronLeft, CreditCard, Lock, Shield, AlertCircle, Loader2, Trash2, Check } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { createAddress, createBooking } from '../lib/api'
import {
  createPaymentIntent,
  listPaymentMethods,
  type SavedPaymentMethod,
  getCardBrandLabel,
} from '../lib/stripeCustomer'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')

  // Saved cards state
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null) // null = new card
  const [saveCard, setSaveCard] = useState(true)
  const [loadingCards, setLoadingCards] = useState(true)

  // Prefill name from customer_profiles (if available)
  useEffect(() => {
    if (!user) return
    supabase
      .from('customer_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ')
          if (fullName && !name) setName(fullName)
        }
      })
      .catch(() => {
        // Ignore - name will just be empty
      })
  }, [user])

  // Get form data from BookPage (preferred) or URL params (legacy)
  const passedFormData = (location.state as any)?.formData
  const initialZip = passedFormData?.zipCode || searchParams.get('zip') || ''
  const serviceType = passedFormData?.serviceType || searchParams.get('service') || 'mowing'
  const lawnSize = passedFormData?.lawnSize || searchParams.get('size') || 'medium'

  // Pricing
  const servicePrices: Record<string, number> = {
    small: 35,
    medium: 45,
    large: 65,
    custom: 0,
  }
  const serviceLabels: Record<string, string> = {
    small: 'Small Yard',
    medium: 'Medium Yard',
    large: 'Large Yard',
    custom: 'Custom Quote',
  }
  const basePrice = servicePrices[lawnSize] || 45
  const serviceFee = 2.99
  const total = basePrice + serviceFee

  // Generate booking ID
  const [bookingId] = useState(() => `bk_${crypto.randomUUID()}`)

  // Load saved payment methods
  useEffect(() => {
    if (!user) {
      setLoadingCards(false)
      return
    }
    listPaymentMethods(user.id)
      .then((res) => {
        setSavedCards(res.paymentMethods || [])
        // Default to using the first saved card if any
        if (res.paymentMethods && res.paymentMethods.length > 0) {
          const defaultCard = res.paymentMethods.find((c) => c.isDefault) || res.paymentMethods[0]
          setSelectedCardId(defaultCard.id)
        }
      })
      .catch((err) => {
        console.error('Failed to load saved cards:', err)
      })
      .finally(() => setLoadingCards(false))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError('')

    if (!stripe || !elements || !user) {
      setPaymentError('Payment system is still loading. Please try again.')
      return
    }

    // If using a saved card, we don't need the card element
    if (!selectedCardId) {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setPaymentError('Card element not found.')
        return
      }
    }

    setIsProcessing(true)
    try {
      // Create PaymentIntent via Edge Function
      const intentParams: any = {
        amount: total,
        booking_id: bookingId,
        user_id: user.id,
        customer_email: email,
        customer_name: name,
      }
      if (selectedCardId) {
        // Use saved card
        intentParams.payment_method_id = selectedCardId
      } else if (saveCard) {
        // Save the new card after payment
        intentParams.save_card = true
      }

      const data = await createPaymentIntent(intentParams)
      const { clientSecret } = data
      if (!clientSecret) {
        throw new Error('No client secret returned from payment server')
      }

      let paymentIntent
      if (selectedCardId) {
        // Use saved card - confirm without user interaction
        const { error, paymentIntent: pi } = await stripe.confirmCardPayment(clientSecret)
        if (error) throw new Error(error.message)
        paymentIntent = pi
      } else {
        // New card - get card element
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) throw new Error('Card element not found')

        const { error, paymentIntent: pi } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: name || undefined,
              email: email || undefined,
            },
          },
        })
        if (error) throw new Error(error.message)
        paymentIntent = pi
      }

      if (paymentIntent?.status === 'succeeded') {
        // Create the booking in the database
        if (passedFormData) {
          try {
            const { data: address } = await createAddress({
              user_id: user.id,
              street_1: passedFormData.address,
              zip_code: passedFormData.zipCode,
              city: passedFormData.city || 'Unknown',
              state: passedFormData.state || 'TX',
              country: 'USA',
            })
            if (address) {
              const sizeMap: Record<string, string> = {
                small: 'small',
                medium: 'medium',
                large: 'large',
                standard: 'standard',
                'custom-quote': 'custom_quote',
              }
              const freqMap: Record<string, string> = {
                'one-time': 'one_time',
                weekly: 'weekly',
                biweekly: 'biweekly',
                monthly: 'monthly',
              }
              await createBooking({
                customer_id: user.id,
                address_id: address.id,
                yard_size_category: (sizeMap[lawnSize] || 'medium') as any,
                service_type: 'lawn_mowing',
                service_frequency: (freqMap[passedFormData.frequency] || 'one_time') as any,
                scheduled_date: passedFormData.date || null,
                scheduled_time_window: passedFormData.time || null,
                estimated_price: total,
                booking_status: 'booked',
                payment_status: 'paid',
                notes: passedFormData.specialInstructions || null,
              })
            }
          } catch (dbErr: any) {
            console.error('Failed to create booking after payment:', dbErr)
          }
        }

        navigate('/booking-confirmation', {
          state: {
            bookingId,
            total,
            paymentIntentId: paymentIntent.id,
            serviceType,
            lawnSize,
          },
        })
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status}`)
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md border border-red-200">
          <AlertCircle className="text-red-500 mb-3" size={32} />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Not Configured</h2>
          <p className="text-slate-600 text-sm">
            Stripe is not configured. The site admin needs to set VITE_STRIPE_PUBLISHABLE_KEY.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to={`/book?zip=${initialZip}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ChevronLeft size={18} /> Back to booking
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
        <p className="text-slate-600 mb-6">Secure payment powered by Stripe</p>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* Service summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-3">Service</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{serviceLabels[lawnSize] || 'Lawn Service'}</p>
                    <p className="text-sm text-slate-500">Recurring weekly service</p>
                  </div>
                  <p className="font-semibold text-slate-900">${basePrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-3">Contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Name on card</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment method selector */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard size={18} /> Payment method
                </h2>

                {loadingCards ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Saved cards */}
                    {savedCards.length > 0 && savedCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedCardId === card.id
                            ? 'border-[#22C55E] bg-green-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          checked={selectedCardId === card.id}
                          onChange={() => setSelectedCardId(card.id)}
                          className="w-4 h-4 accent-[#22C55E]"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">
                            {getCardBrandLabel(card.brand)} ending in {card.last4}
                          </div>
                          <div className="text-xs text-slate-500">
                            Expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                            {card.isDefault && <span className="ml-2 text-[#22C55E] font-medium">Default</span>}
                          </div>
                        </div>
                        {selectedCardId === card.id && (
                          <Check size={18} className="text-[#22C55E]" />
                        )}
                      </label>
                    ))}

                    {/* New card option */}
                    <label
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedCardId === null
                          ? 'border-[#22C55E] bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        checked={selectedCardId === null}
                        onChange={() => setSelectedCardId(null)}
                        className="w-4 h-4 accent-[#22C55E]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 text-sm">Use a new card</div>
                        <div className="text-xs text-slate-500">Enter card details below</div>
                      </div>
                    </label>

                    {/* Stripe card element (shown when new card is selected) */}
                    {selectedCardId === null && (
                      <div className="mt-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: '#1e293b',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                '::placeholder': { color: '#94a3b8' },
                              },
                              invalid: { color: '#dc2626' },
                            },
                            hidePostalCode: true,
                          }}
                          onChange={(e) => {
                            setCardComplete(e.complete)
                            if (e.error) setPaymentError(e.error.message)
                            else setPaymentError('')
                          }}
                        />
                      </div>
                    )}

                    {/* Save card checkbox (only for new cards) */}
                    {selectedCardId === null && (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="w-4 h-4 accent-[#22C55E]"
                        />
                        <span className="text-sm text-slate-700">
                          Save this card for faster checkout next time
                        </span>
                      </label>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                  <Lock size={12} /> Secured by Stripe. We never see your card details.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Test card: <span className="font-mono">4242 4242 4242 4242</span> · any future date · any CVC
                </p>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{paymentError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  !stripe ||
                  isProcessing ||
                  (!selectedCardId && !cardComplete)
                }
                className="w-full bg-[#22C55E] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Lock size={20} /> Pay ${total.toFixed(2)}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield size={12} /> 256-bit SSL encryption
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sticky top-4">
                <h2 className="font-semibold text-slate-900 mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service ({serviceLabels[lawnSize]})</span>
                    <span className="text-slate-900">${basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Service fee</span>
                    <span className="text-slate-900">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold text-base">
                    <span className="text-slate-900">Total</span>
                    <span className="text-[#22C55E]">${total.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  Your pro will be paid weekly via direct deposit. MowList takes a small platform fee to keep the lights on.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md border border-red-200">
          <AlertCircle className="text-red-500 mb-3" size={32} />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Not Configured</h2>
          <p className="text-slate-600 text-sm">
            Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in the environment.
          </p>
          <Link to="/" className="inline-block mt-4 text-[#22C55E] hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}
