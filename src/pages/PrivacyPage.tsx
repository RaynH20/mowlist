import { Shield, Lock, Eye, Database, Mail, Users } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-lg text-slate-600">Last updated: March 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
            <p className="text-slate-600 leading-relaxed">
              At MowList, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this privacy policy carefully.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Personal Information</h3>
                  <p className="text-slate-600">Name, email address, phone number, home address, and payment information when you create an account or book services.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Service Data</h3>
                  <p className="text-slate-600">Information about your property, service preferences, booking history, and communication with service providers.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Provide and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Match you with appropriate service providers</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Communicate with you about products, services, and events</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Data Security</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Encryption</h3>
                  <p className="text-slate-600">We use industry-standard encryption to protect your personal information during transmission.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Payment Security</h3>
                  <p className="text-slate-600">All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor. We never store your full credit card details.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Information Sharing</h2>
            <p className="text-slate-600 leading-relaxed">
              We may share your information with service providers who perform services on our behalf (such as payment processing, customer service, and marketing). We require these providers to protect your information and use it only for the services they perform.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Your Rights</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of certain data collection or sharing</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@mowlist.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
