import { useState, useEffect } from 'react'
import { CreditCard, Trash2, Loader2, Plus, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import {
  listPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getCardBrandLabel,
  type SavedPaymentMethod,
} from '../../lib/stripeCustomer'

export default function PaymentMethods() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<SavedPaymentMethod[]>([])
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const loadCards = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await listPaymentMethods(user.id)
      setCards(res.paymentMethods || [])
      setDefaultCardId(res.defaultPaymentMethodId)
    } catch (err: any) {
      setError(err.message || 'Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [user])

  const handleDelete = async (pmId: string) => {
    if (!confirm('Remove this card? You can re-add it anytime.')) return
    if (!user) return
    setActionInProgress(pmId)
    try {
      await deletePaymentMethod(pmId)
      // If we deleted the default, clear it
      if (pmId === defaultCardId) {
        await setDefaultPaymentMethod(user.id, '')
      }
      await loadCards()
    } catch (err: any) {
      setError(err.message || 'Failed to delete card')
    } finally {
      setActionInProgress(null)
    }
  }

  const handleSetDefault = async (pmId: string) => {
    if (!user) return
    setActionInProgress(pmId)
    try {
      await setDefaultPaymentMethod(user.id, pmId)
      setDefaultCardId(pmId)
      // Update local state to reflect new default
      setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === pmId })))
    } catch (err: any) {
      setError(err.message || 'Failed to set default card')
    } finally {
      setActionInProgress(null)
    }
  }

  if (!user) return null

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Payment Methods</h1>
      <p className="text-slate-500 mb-6">Manage your saved cards for faster checkout</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <Loader2 size={24} className="animate-spin text-slate-400 mx-auto" />
        </div>
      ) : cards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-10 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={28} className="text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">No saved cards</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Add a card during checkout to save it for next time. Saved cards make booking faster.
          </p>
          <a
            href="/book"
            className="inline-block bg-[#22C55E] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors"
          >
            <Plus size={18} className="inline mr-1" /> Book a service
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4 ${
                card.isDefault ? 'border-[#22C55E] ring-1 ring-[#22C55E]' : 'border-slate-100'
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {card.brand.toUpperCase().slice(0, 4)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900">
                    {getCardBrandLabel(card.brand)} ending in {card.last4}
                  </p>
                  {card.isDefault && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      <Check size={10} /> Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  Expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    disabled={actionInProgress === card.id}
                    className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    {actionInProgress === card.id ? <Loader2 size={14} className="animate-spin" /> : 'Set default'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(card.id)}
                  disabled={actionInProgress === card.id}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  aria-label="Remove card"
                >
                  {actionInProgress === card.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <a
              href="/book"
              className="inline-flex items-center gap-2 text-sm text-[#22C55E] hover:text-[#16A34A] font-medium"
            >
              <Plus size={16} /> Add another card
            </a>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
        <p className="font-medium mb-1">🔒 Your cards are secure</p>
        <p className="text-blue-600 text-xs">
          Card details are stored by Stripe (PCI-DSS compliant). MowList never sees your card number.
          Removing a card here only unlinks it from MowList — Stripe still keeps a record per their retention policy.
        </p>
      </div>
    </div>
  )
}
