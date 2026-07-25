import { Calendar, Clock, AlertCircle, RefreshCw, DollarSign, CheckCircle } from 'lucide-react'

export default function CancellationPage() {
  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Cancellation Policy</h1>
          <p className="text-lg text-slate-600">Last updated: March 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Understanding Our Cancellation Policy</h2>
            <p className="text-slate-600 leading-relaxed">
              We understand plans change. Our cancellation policy is designed to be fair to both customers and service providers while ensuring reliable service for everyone.
            </p>
          </section>

          {/* Cancellation Windows */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Cancellation Windows</h2>
            <div className="space-y-4">
              {/* More than 24 hours */}
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-green-900">More than 24 hours before service</h3>
                  <p className="text-green-700 mt-1">Full refund - No cancellation fee</p>
                  <p className="text-sm text-green-600 mt-2">Cancel anytime and receive a full refund to your original payment method.</p>
                </div>
              </div>

              {/* Less than 24 hours */}
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-amber-900">Less than 24 hours before service</h3>
                  <p className="text-amber-700 mt-1">50% cancellation fee</p>
                  <p className="text-sm text-amber-600 mt-2">A 50% fee applies because the provider has reserved this time slot.</p>
                </div>
              </div>

              {/* Same day */}
              <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <Clock className="text-red-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-red-900">Same day cancellation or no-show</h3>
                  <p className="text-red-700 mt-1">No refund - Full charge</p>
                  <p className="text-sm text-red-600 mt-2">The provider has allocated time and resources. No refund is available.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Provider No-Show */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Provider No-Show</h2>
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <AlertCircle className="text-blue-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-blue-900">If Your Provider Doesn't Show Up</h3>
                <p className="text-blue-700 mt-1">Full refund + $20 credit</p>
                <p className="text-sm text-blue-600 mt-2">If a provider doesn't show up within 30 minutes of the scheduled window, you'll receive a full refund plus a $20 credit toward your next booking.</p>
              </div>
            </div>
          </section>

          {/* How to Cancel */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">How to Cancel</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <RefreshCw className="text-[#22C55E]" size={20} />
                <span>Log into your account and navigate to "My Services"</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="text-[#22C55E]" size={20} />
                <span>Find the scheduled booking and click "Cancel"</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <CheckCircle className="text-[#22C55E]" size={20} />
                <span>You'll receive a confirmation email with refund details</span>
              </div>
            </div>
          </section>

          {/* Refund Processing */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Refund Processing</h2>
            <div className="flex items-start gap-3">
              <DollarSign className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-slate-600">Refunds are processed within 5-10 business days and returned to your original payment method. You'll receive an email confirmation once the refund is processed.</p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have questions about our Cancellation Policy, please contact us at support@mowlist.com or visit our Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
