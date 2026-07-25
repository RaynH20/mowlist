import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, CreditCard, Lock, Shield, MapPin, Calendar, Clock, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialZip = searchParams.get('zip') || ''
  const serviceType = searchParams.get('service') || 'mowing'
  const lawnSize = searchParams.get('size') || 'medium'

  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [cardComplete, setCardComplete] = useState(false)

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    name: '',
    email: '',
    zip: initialZip,
  })

  const servicePrices: Record<string, number> = {
    small: 35,
    medium: 45,
    large: 65,
    custom: 0,
  }

  const basePrice = servicePrices[lawnSize] || 45
  const platformFee = Math.round(basePrice * 0.15)
  const total = basePrice

  const serviceNames: Record<string, string> = {
    mowing: 'Lawn Mowing',
    edging: 'Edging',
    blowing: 'Leaf Blowing',
    custom: 'Custom Service',
  }

  const lawnSizeLabels: Record<string, string> = {
    small: 'Small Yard',
    medium: 'Medium Yard',
    large: 'Large Yard',
    custom: 'Custom Quote',
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value)
    } else if (field === 'cardExpiry') {
      formattedValue = formatExpiry(value)
    } else if (field === 'cardCvc') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4)
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }))

    // Check if card is complete
    if (field === 'cardNumber') {
      setCardComplete(formattedValue.replace(/\s/g, '').length >= 15)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setPaymentError('')

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate success (in real app, would create PaymentIntent on backend)
    navigate('/booking-confirmation', {
      state: {
        bookingId: 'ML-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        service: serviceNames[serviceType],
        lawnSize: lawnSizeLabels[lawnSize],
        price: total,
        date: new Date().toLocaleDateString(),
      }
    })
  }

  return (
    <div className="pt-20 pb-12 bg-slate-50 min-h-screen">
      <div className="max-w-md mx-auto px-4">
        {/* Header */}
        <div className="mb-4">
          <Link to="/book" className="inline-flex items-center text-slate-600 hover:text-[#22C55E] mb-2 text-sm">
            <ChevronLeft size={18} />
            <span className="ml-1">Back to Booking</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Payment Details</h2>

            {/* Card Element Mockup */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={formData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="w-full pl-10 pr-3 py-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Expiry</label>
                  <input
                    type="text"
                    value={formData.cardExpiry}
                    onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">CVC</label>
                  <input
                    type="text"
                    value={formData.cardCvc}
                    onChange={(e) => handleInputChange('cardCvc', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => handleInputChange('zip', e.target.value)}
                    placeholder="12345"
                    maxLength={5}
                    className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="text-red-600 flex-shrink-0" size={16} />
                <span className="text-red-700 text-xs">{paymentError}</span>
              </div>
            )}

            {/* Security Badges - Enhanced */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-center gap-3 text-slate-500">
                <div className="flex items-center gap-1.5 text-xs">
                  <Lock size={12} className="text-[#22C55E]" />
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Shield size={12} className="text-[#22C55E]" />
                  <span>PCI</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <CreditCard size={12} className="text-[#22C55E]" />
                  <span>Stripe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Billing Address</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                className="w-full p-2.5 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                required
              />
              <p className="text-xs text-slate-500 mt-1.5">Receipt will be sent to this email</p>
            </div>
          </div>

          {/* Order Summary - Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Order Summary</h2>

            {/* Service Details */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="text-[#22C55E]" size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-slate-900 text-sm">{serviceNames[serviceType]}</h3>
                <p className="text-xs text-slate-500">{lawnSizeLabels[lawnSize]}</p>
              </div>
              <div className="text-lg font-bold text-[#22C55E]">${total}</div>
            </div>

            {/* Payment Protection */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-start gap-2">
                <Shield className="text-[#22C55E] flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-green-900 text-xs">Payment Protection</h4>
                  <p className="text-xs text-green-700 mt-0.5">
                    Payment held until service is complete
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || !cardComplete}
            className={`w-full py-3 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              isProcessing || !cardComplete
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-sm'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                <Lock size={18} />
                Pay ${total} Securely
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500 mt-3">
            By completing, you agree to our Terms & Privacy Policy
          </p>
        </form>
      </div>
    </div>
  )
}
