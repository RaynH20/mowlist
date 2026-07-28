import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { ChevronLeft, CreditCard, Lock, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/auth-context'

// Load Stripe outside the component so it only happens once
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')

  const initialZip = searchParams.get('zip') || ''
  const serviceType = searchParams.get('service') || 'mowing'
  const lawnSize = searchParams.get('size') || 'medium'

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

  // Generate or retrieve a booking ID (for the payment metadata)
  // In a real flow, we'd create the booking first, then pay. For MVP, we generate an ID client-side.
  const [bookingId] = useState(() => `bk_${crypto.randomUUID()}`)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentError('')

    if (!stripe || !elements) {
      setPaymentError('Payment system is still loading. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setPaymentError('Card element not found.')
      return
    }

    setIsProcessing(true)
    try {
      // 1. Create PaymentIntent via our Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            amount: total,
            booking_id: bookingId,
            customer_email: email,
            customer_name: name,
          }),
        }
      )

      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      const { clientSecret } = data
      if (!clientSecret) {
        throw new Error('No client secret returned from payment server')
      }

      // 2. Confirm the payment with Stripe.js
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name || undefined,
            email: email || undefined,
          },
        },
      })

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        // Navigate to confirmation with the booking ID
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
            {/* Left: Form */}
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

              {/* Stripe Card Element */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CreditCard size={18} /> Payment
                </h2>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
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
                      hidePostalCode: true, // we collect it via the form
                    }}
                    onChange={(e) => {
                      setCardComplete(e.complete)
                      if (e.error) {
                        setPaymentError(e.error.message)
                      } else {
                        setPaymentError('')
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
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
                disabled={!stripe || !cardComplete || isProcessing}
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

            {/* Right: Order summary */}
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
  const [searchParams] = useSearchParams()
  const initialZip = searchParams.get('zip') || ''

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl p-6 max-w-md border border-red-200">
          <AlertCircle className="text-red-500 mb-3" size={32} />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Payment Not Configured</h2>
          <p className="text-slate-600 text-sm">
            Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY in the environment.
          </p>
          <Link
            to="/"
            className="inline-block mt-4 text-[#22C55E] hover:underline"
          >
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
