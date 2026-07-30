import { Link, useLocation } from 'react-router-dom'
import { Check, Calendar, MapPin, CreditCard, Download, Mail, Clock, Home, ArrowRight } from 'lucide-react'

interface BookingConfirmationState {
  bookingId: string
  service: string
  lawnSize: string
  price: number
  date: string
}

export default function BookingConfirmationPage() {
  const location = useLocation()
  const state = location.state as BookingConfirmationState | null

  const fullBookingId = state?.bookingId || 'ML-' + Math.random().toString(36).substr(2, 9).toUpperCase()
  // Show a short, friendly booking reference (last 8 chars) for the UI
  const bookingId = fullBookingId.length > 12
    ? `#${fullBookingId.slice(-8).toUpperCase()}`
    : fullBookingId
  const service = state?.service || 'Lawn Mowing'
  const lawnSize = state?.lawnSize || 'Medium Yard'
  const price = state?.price || 45
  const date = state?.date || new Date().toLocaleDateString()

  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <Check size={48} className="text-[#22C55E]" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-slate-600">Your lawn service has been scheduled</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          {/* Booking ID */}
          <div className="bg-gradient-to-r from-[#22C55E] to-emerald-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Booking ID</span>
              <span
                className="text-white font-mono font-semibold text-lg"
                title={fullBookingId}
              >
                {bookingId}
              </span>
            </div>
            {fullBookingId !== bookingId && (
              <div className="text-white/60 text-xs mt-1 text-right font-mono">
                {fullBookingId}
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="text-[#22C55E]" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{service}</h3>
                <p className="text-sm text-slate-500">{lawnSize}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin size={18} className="text-slate-400" />
                <span>123 Main Street, Austin, TX 78701</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Clock size={18} className="text-slate-400" />
                <span>{date} at 10:00 AM - 12:00 PM</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <CreditCard size={18} className="text-slate-400" />
                <span>Payment held until service complete</span>
              </div>
            </div>

            {/* Price */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-2xl font-bold text-[#22C55E]">${price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">What Happens Next</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#22C55E] font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Confirmation Email Sent</h3>
                <p className="text-sm text-slate-500">Check your email for booking details and receipt</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#22C55E] font-semibold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Pro Assigned</h3>
                <p className="text-sm text-slate-500">You'll be matched with a local lawn pro within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#22C55E] font-semibold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Service Day</h3>
                <p className="text-sm text-slate-500">Your pro will arrive during the scheduled time window</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[#22C55E] font-semibold text-sm">4</span>
              </div>
              <div>
                <h3 className="font-medium text-slate-900">Payment Released</h3>
                <p className="text-sm text-slate-500">Payment is released to your pro after you confirm completion</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 bg-[#22C55E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors">
            <Download size={20} />
            Download Receipt
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
            <Mail size={20} />
            Resend Email
          </button>
        </div>

        {/* Track Service CTA */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg mb-1">Track Your Service</h3>
              <p className="text-blue-200 text-sm">Follow your booking in real-time</p>
            </div>
            <Link
              to="/dashboard/track"
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              View Details
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link to="/" className="text-[#22C55E] font-medium hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
