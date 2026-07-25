import { Shield, CheckCircle, Users, DollarSign, Calendar, Clock } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Terms of Service</h1>
          <p className="text-lg text-slate-600">Last updated: March 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-600 leading-relaxed">
              Welcome to MowList. These Terms of Service ("Terms") govern your use of the MowList platform, including our website, mobile application, and services (collectively, the "Platform"). By accessing or using MowList, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access our Platform.
            </p>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. User Accounts</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Account Registration</h3>
                  <p className="text-slate-600">You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Account Responsibilities</h3>
                  <p className="text-slate-600">You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Service Terms */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Service Terms</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Booking Services</h3>
                  <p className="text-slate-600">When you book a service through MowList, you agree to the pricing and terms specified for that service. Bookings are subject to availability.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Service windows</h3>
                  <p className="text-slate-600">Service providers will arrive within the scheduled time window. We appreciate flexibility as exact times may vary based on job complexity.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Payments and Billing</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <DollarSign className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Payment Terms</h3>
                  <p className="text-slate-600">Payments are processed securely through Stripe. Your payment is held until service is completed and confirmed by you.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Refunds</h3>
                  <p className="text-slate-600">Refund eligibility depends on our Cancellation Policy. Please review that policy for details on refund eligibility.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Pro Terms */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Service Provider Terms</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you register as a Service Provider ("Pro") on MowList, you agree to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Provide services as described in your bookings</li>
              <li>Maintain proper licensing and insurance</li>
              <li>Arrive within the scheduled time window</li>
              <li>Treat customers with professionalism and respect</li>
              <li>Complete services to satisfactory standards</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-slate-600 leading-relaxed">
              MowList acts as a marketplace connecting customers with independent service providers. We are not responsible for the actual services provided. While we vet providers and facilitate payments, we do not guarantee the quality of services provided by third-party providers.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about these Terms, please contact us at support@mowlist.com or visit our Contact page.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
