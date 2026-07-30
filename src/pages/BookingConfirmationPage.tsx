import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Check, Calendar, MapPin, CreditCard, Download, Mail, Clock, Home, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface BookingConfirmationState {
  bookingId: string
  service: string
  lawnSize: string
  price: number
  date: string
  paymentIntentId?: string
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

  const [stripeReceiptUrl, setStripeReceiptUrl] = useState<string | null>(null)

  // Try to grab the Stripe-hosted receipt URL (only if a real bookingId was passed in)
  useEffect(() => {
    const realBookingId = state?.bookingId
    if (!realBookingId || realBookingId.startsWith('ML-')) return
    supabase
      .from('payments')
      .select('receipt_url')
      .eq('booking_id', realBookingId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.receipt_url) setStripeReceiptUrl(data.receipt_url)
      })
      .catch(() => {
        // Ignore - we'll fall back to the generated receipt
      })
  }, [state?.bookingId])

  // Generate a printable HTML receipt (used as fallback when Stripe receipt isn't available)
  const handleDownloadReceipt = () => {
    if (stripeReceiptUrl) {
      // Open the official Stripe-hosted receipt — looks like a real receipt and supports save-as-PDF
      window.open(stripeReceiptUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const generatedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    const subtotal = Math.max(0, price - 2.99).toFixed(2)
    const fee = '2.99'
    const total = price.toFixed(2)

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>MowList Receipt ${bookingId}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; color: #1e293b; background: #fff; }
  .header { border-bottom: 2px solid #22C55E; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .logo { font-size: 24px; font-weight: 800; }
  .logo .green { color: #22C55E; }
  .logo .blue { color: #1E40AF; }
  .meta { text-align: right; color: #64748b; font-size: 13px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; }
  .row.total { font-weight: 700; font-size: 18px; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
  .label { color: #64748b; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 32px; }
  .booking-id { font-family: monospace; font-weight: 600; color: #22C55E; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; text-align: center; }
  .actions { text-align: center; margin: 20px 0; }
  .actions button { background: #22C55E; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin: 0 6px; }
  .actions button.secondary { background: #e2e8f0; color: #1e293b; }
  @media print { body { margin: 0; } .actions { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo"><span class="green">Mow</span><span class="blue">List</span></div>
      <div style="color: #64748b; font-size: 13px; margin-top: 4px;">Lawn care, made simple</div>
    </div>
    <div class="meta">
      <div><strong>Receipt</strong></div>
      <div>${generatedDate}</div>
    </div>
  </div>

  <h2>Booking</h2>
  <div class="row"><span class="label">Booking ID</span><span class="booking-id">${bookingId}</span></div>
  <div class="row"><span class="label">Service</span><span>${service}</span></div>
  <div class="row"><span class="label">Yard size</span><span>${lawnSize}</span></div>
  <div class="row"><span class="label">Service date</span><span>${date}</span></div>

  <h2>Payment</h2>
  <div class="row"><span class="label">${service} (${lawnSize})</span><span>$${subtotal}</span></div>
  <div class="row"><span class="label">Service fee</span><span>$${fee}</span></div>
  <div class="row total"><span>Total paid</span><span>$${total}</span></div>

  <div class="actions">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
  </div>

  <div class="footer">
    Payment held until service is complete. MowList takes a small platform fee to keep the lights on.<br />
    Questions? hello@mowlist.com
  </div>
</body>
</html>`

    // Use a Blob URL — this is more reliable than window.open with document.write
    // (which some browsers block or fail to render properly)
    try {
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank', 'noopener,noreferrer')
      if (win) {
        // Clean up the blob URL after the window has had a chance to load it
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      } else {
        // Popup was blocked — fall back to downloading the file
        const a = document.createElement('a')
        a.href = url
        a.download = `mowlist-receipt-${bookingId.replace(/[^A-Z0-9]/gi, '')}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 60000)
      }
    } catch (err) {
      // Last-resort fallback: try the old approach
      const win = window.open('', '_blank')
      if (win) {
        win.document.open()
        win.document.write(html)
        win.document.close()
      }
    }
  }

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
          <button
            onClick={handleDownloadReceipt}
            className="flex-1 flex items-center justify-center gap-2 bg-[#22C55E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors"
          >
            <Download size={20} />
            {stripeReceiptUrl ? 'View Receipt' : 'Download Receipt'}
          </button>
          <button
            onClick={() => alert('Email receipts are coming with our notification system. For now, use "Download Receipt" to get a copy.')}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
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
