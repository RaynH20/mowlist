import { CreditCard, Plus, Shield } from 'lucide-react'

export default function PaymentMethods() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Payment Methods</h1>

      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="text-blue-600" size={32} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">No payment methods saved</h2>
        <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
          You haven't saved any payment methods yet. When Stripe payments are enabled, you'll be able to add cards here.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-2 bg-slate-100 text-slate-400 px-6 py-2.5 rounded-lg font-medium cursor-not-allowed"
        >
          <Plus size={18} />
          Add Payment Method
        </button>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-medium text-blue-900 text-sm">Secure payments coming soon</h3>
          <p className="text-blue-800 text-sm mt-1">
            When Stripe is connected, your card details will be stored securely by Stripe — never on our servers. You'll be able to add cards, set a default, and remove them anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
