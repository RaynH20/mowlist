import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { ChevronLeft, CreditCard, Lock, Shield, AlertCircle, Loader2, Check } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { createSetupIntent } from '../lib/stripeCustomer'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

function AddCardForm() {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardError, setCardError] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCardError('')

    if (!stripe || !elements || !user) {
      setCardError('Payment system is still loading. Please try again.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setCardError('Card element not found.')
      return
    }

    setIsProcessing(true)
    try {
      // 1. Create a SetupIntent
      const { clientSecret } = await createSetupIntent({
        user_id: user.id,
        customer_email: email,
        customer_name: name,
      })

      if (!clientSecret) {
        throw new Error('No client secret returned from payment server')
      }

      // 2. Confirm the SetupIntent with the new card
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name || undefined,
            email: email || undefined,
          },
        },
      })

      if (error) throw new Error(error.message)
      if (setupIntent?.status !== 'succeeded') {
        throw new Error(`Setup status: ${setupIntent?.status}`)
      }

      // 3. Card is saved! Show success and redirect
      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard/payment')
      }, 1500)
    } catch (err: any) {
      setCardError(err.message || 'Failed to save card. Please try again.')
      setIsProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-[#22C55E]" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Card saved!</h2>
          <p className="text-slate-600 text-sm">Redirecting you back to your payment methods...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <Link
          to="/dashboard/payment"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ChevronLeft size={18} /> Back to Payment Methods
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="text-[#22C55E]" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Add a card</h1>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Save a card now so checkout is one click next time.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contact info */}
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

            {/* Card element */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Card details</label>
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
                    hidePostalCode: true,
                  }}
                  onChange={(e) => {
                    setCardComplete(e.complete)
                    if (e.error) setCardError(e.error.message)
                    else setCardError('')
                  }}
                />
              </div>
            </div>

            {cardError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{cardError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!stripe || isProcessing || !cardComplete}
              className="w-full bg-[#22C55E] text-white py-3.5 rounded-xl font-semibold text-base hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving card...
                </>
              ) : (
                <>
                  <Lock size={18} /> Save card
                </>
              )}
            </button>

            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Lock size={12} /> Secured by Stripe. We never see your card details.
              </p>
              <p className="text-xs text-slate-400">
                Test card: <span className="font-mono">4242 4242 4242 4242</span> · any future date · any CVC
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Shield size={12} /> 256-bit SSL encryption
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AddCardPage() {
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
    <Elements stripe={stripePromise}>
      <AddCardForm />
    </Elements>
  )
}
