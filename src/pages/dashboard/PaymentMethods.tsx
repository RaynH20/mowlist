import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Trash2, Loader2, Plus, AlertCircle, Check, Receipt, Calendar, ArrowDown, ArrowUp } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import {
  listPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getCardBrandLabel,
  type SavedPaymentMethod,
} from '../../lib/stripeCustomer'
import { getCustomerPayments, getCustomerBookings } from '../../lib/api'
import type { Payment, Booking } from '../../lib/database.types'

type PaymentWithBooking = Payment & {
  booking?: Pick<Booking, 'id' | 'scheduled_date' | 'service_type' | 'service_frequency' | 'yard_size_category'>
}

export default function PaymentMethods() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<SavedPaymentMethod[]>([])
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null)
  const [payments, setPayments] = useState<PaymentWithBooking[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const loadAll = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const [pmRes, payRes, bookingsRes] = await Promise.all([
        listPaymentMethods(user.id),
        getCustomerPayments(user.id),
        getCustomerBookings(user.id),
      ])
      setCards(pmRes.paymentMethods || [])
      setDefaultCardId(pmRes.defaultPaymentMethodId)

      // Hydrate payments with their booking details
      const bookings = (bookingsRes.data || []) as Booking[]
      setBookings(bookings)
      const bookingMap = new Map(bookings.map(b => [b.id, b]))
      const paymentsWithBooking: PaymentWithBooking[] = (payRes.data || []).map(p => {
        const b = bookingMap.get(p.booking_id)
        return b ? { ...p, booking: {
          id: b.id,
          scheduled_date: b.scheduled_date,
          service_type: b.service_type,
          service_frequency: b.service_frequency,
          yard_size_category: b.yard_size_category,
        }} : p
      })
      setPayments(paymentsWithBooking)
    } catch (err: any) {
      setError(err.message || 'Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [user])

  const handleDelete = async (pmId: string) => {
    if (!confirm('Remove this card? It will no longer be charged.')) return
    setActionInProgress(pmId)
    setError(null)
    try {
      const result = await deletePaymentMethod(user!.id, pmId)
      if (result.error) throw new Error(result.error)
      await loadAll()
    } catch (err: any) {
      setError(err.message || 'Failed to remove card')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleSetDefault = async (pmId: string) => {
    setActionInProgress(pmId)
    setError(null)
    try {
      const result = await setDefaultPaymentMethod(user!.id, pmId)
      if (result.error) throw new Error(result.error)
      await loadAll()
    } catch (err: any) {
      setError(err.message || 'Failed to set default card')
    } finally {
      setActionInProgress(null)
    }
  }

  // Calculate totals
  const totalSpent = payments
    .filter(p => p.payment_status === 'succeeded' || p.payment_status === 'captured')
    .reduce((sum, p) => sum + (p.amount || 0), 0) / 100 // Stripe amounts are in cents
  const totalRefunded = payments
    .filter(p => p.payment_status === 'refunded' || p.payment_status === 'partially_refunded')
    .reduce((sum, p) => sum + (p.amount || 0), 0) / 100

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#22C55E]" size={32} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Payment</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ============ Payment Methods ============ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900">Payment methods</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">Manage your saved cards for faster checkout</p>

        {cards.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="text-slate-400" size={20} />
            </div>
            <p className="text-slate-600 mb-4">No saved cards yet</p>
            <Link
              to="/add-card"
              className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors text-sm"
            >
              <Plus size={16} /> Add a card
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <div key={card.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{getCardBrandLabel(card.brand)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">
                    {getCardBrandLabel(card.brand)} ending in {card.last4}
                  </p>
                  <p className="text-sm text-slate-500">
                    Expires {String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).slice(-2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {card.id === defaultCardId ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[#16A34A] font-medium">
                      <Check size={14} /> Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(card.id)}
                      disabled={actionInProgress === card.id}
                      className="text-sm text-slate-600 hover:text-[#16A34A] font-medium disabled:opacity-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(card.id)}
                    disabled={actionInProgress === card.id}
                    className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
                    aria-label="Remove card"
                  >
                    {actionInProgress === card.id ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <Link
              to="/add-card"
              className="flex items-center gap-2 text-[#22C55E] hover:text-[#16A34A] font-medium text-sm mt-3 px-1"
            >
              <Plus size={16} /> Add another card
            </Link>
          </div>
        )}
      </div>

      {/* ============ Payment Activity ============ */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Payment activity</h2>
        <p className="text-sm text-slate-500 mb-4">Your past payments, refunds, and pending charges</p>

        {/* Summary stats */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <ArrowUp size={12} className="text-[#22C55E]" />
                Total paid
              </div>
              <div className="text-2xl font-bold text-slate-900">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <ArrowDown size={12} className="text-amber-500" />
                Total refunded
              </div>
              <div className="text-2xl font-bold text-slate-900">${totalRefunded.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Transaction list */}
        {payments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt className="text-slate-400" size={20} />
            </div>
            <p className="text-slate-900 font-medium">No payment activity yet</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Under MowList's "pay on completion" model, payment is captured when your pro finishes the job — not when you book.
              Your first payment will show up here after your first completed service.
            </p>
            <Link
              to="/dashboard/services"
              className="inline-flex items-center gap-1 text-sm text-[#22C55E] font-medium hover:underline mt-3"
            >
              View your upcoming services →
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => {
                const isRefunded = payment.payment_status === 'refunded'
                const isPartiallyRefunded = payment.payment_status === 'partially_refunded'
                const isSucceeded = payment.payment_status === 'succeeded' || payment.payment_status === 'captured'
                const amount = (payment.amount || 0) / 100
                const date = payment.created_at ? new Date(payment.created_at) : null
                return (
                  <div key={payment.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isRefunded
                        ? 'bg-amber-100 text-amber-600'
                        : isSucceeded
                        ? 'bg-green-100 text-[#16A34A]'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isRefunded ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-medium text-slate-900">
                          {payment.booking?.service_type === 'lawn_mowing' ? 'Lawn mowing' : (payment.booking?.service_type || 'Service')}
                          {payment.booking?.service_frequency && payment.booking.service_frequency !== 'one_time' && (
                            <span className="text-slate-500 font-normal"> · {payment.booking.service_frequency.replace('_', '-')}</span>
                          )}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isSucceeded
                            ? 'bg-green-100 text-[#16A34A]'
                            : isRefunded
                            ? 'bg-amber-100 text-amber-700'
                            : isPartiallyRefunded
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {payment.payment_status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {payment.booking?.scheduled_date && (
                          <span>· service {new Date(payment.booking.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-base font-bold ${isRefunded ? 'text-amber-600' : 'text-slate-900'}`}>
                        {isRefunded ? '−' : ''}${amount.toFixed(2)}
                      </div>
                      {payment.receipt_url && (
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#22C55E] hover:underline"
                        >
                          Receipt
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============ Your Bookings (all with payment status) ============ */}
      {bookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-900 mb-3">All your bookings</h2>
          <p className="text-sm text-slate-500 mb-4">
            Payment status for each booking. Payment is captured when your pro finishes the job.
          </p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="divide-y divide-slate-100">
              {bookings
                .filter((b: any) => b.booking_status === 'completed' || b.booking_status === 'in_progress' || b.booking_status === 'arrived' || b.booking_status === 'on_the_way' || b.booking_status === 'provider_assigned' || b.booking_status === 'booked')
                .slice(0, 10)
                .map((booking: any) => {
                  const payStatus = booking.payment_status
                  const isPaid = payStatus === 'captured' || payStatus === 'succeeded'
                  const isRefunded = payStatus === 'refunded'
                  const isFailed = payStatus === 'failed'
                  const amount = booking.estimated_price || 0
                  const date = booking.scheduled_date ? new Date(booking.scheduled_date) : null
                  return (
                    <Link
                      key={booking.id}
                      to={`/dashboard/track?booking=${booking.id}`}
                      className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <ProAvatar
                        imageUrl={booking.provider_image_url}
                        name={booking.provider_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {booking.provider_name || 'Awaiting pro assignment'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {date ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'} · {booking.booking_status.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-900">${amount.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${
                          isPaid
                            ? 'bg-green-100 text-[#16A34A]'
                            : isRefunded
                            ? 'bg-amber-100 text-amber-700'
                            : isFailed
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {payStatus === 'pending' ? 'Payment on completion' : payStatus}
                        </span>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* ============ Security Notice ============ */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-start gap-2">
          <span className="text-blue-600 text-lg">🔒</span>
          <div>
            <p className="font-semibold text-blue-900 text-sm">Your cards are secure</p>
            <p className="text-sm text-blue-800 mt-1">
              Card details are stored by Stripe (PCI-DSS compliant). MowList never sees your card number.
              Removing a card here only unlinks it from MowList — Stripe still keeps a record per their retention policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
