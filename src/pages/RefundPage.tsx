import { DollarSign, Clock, CreditCard, RefreshCw, Shield, Mail, AlertCircle } from 'lucide-react'

export default function RefundPage() {
  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Refund Policy</h1>
          <p className="text-lg text-slate-600">Last updated: March 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Our Refund Commitment</h2>
            <p className="text-slate-600 leading-relaxed">
              We strive to ensure every customer is satisfied with their service. If something goes wrong, we're here to help. This policy outlines when and how refunds are issued.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Refund Eligibility</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Full Refund</h3>
                  <p className="text-slate-600">Full refunds are available when you cancel more than 24 hours before your scheduled service.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Partial Refund</h3>
                  <p className="text-slate-600">A 50% refund is available for cancellations made less than 24 hours before service.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">No Refund</h3>
                  <p className="text-slate-600">No refunds are available for same-day cancellations or no-shows.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quality Issues */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Service Quality Issues</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you're not satisfied with the service provided, please let us know within 48 hours. We may offer:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Partial refund for incomplete service</li>
              <li>Full refund for significantly inadequate service</li>
              <li>Free re-service by the same or different provider</li>
              <li>Account credit for future services</li>
            </ul>
          </section>

          {/* Processing */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Refund Processing</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Processing Time</h3>
                  <p className="text-slate-600">Refunds are processed within 5-10 business days. The time it takes for the refund to appear in your account depends on your bank or payment provider.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Refund Method</h3>
                  <p className="text-slate-600">Refunds are issued to the original payment method used for the booking.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Request Process */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">How to Request a Refund</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="w-8 h-8 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-semibold">1</span>
                <span>Log into your account</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="w-8 h-8 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-semibold">2</span>
                <span>Go to "My Services" and select the booking</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="w-8 h-8 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-semibold">3</span>
                <span>Click "Request Refund" and provide details</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="w-8 h-8 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-semibold">4</span>
                <span>We'll review and process within 5-10 business days</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <div className="flex items-start gap-3">
              <Mail className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-slate-600">For refund requests or questions, please contact us at support@mowlist.com.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
