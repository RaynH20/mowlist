import { AlertTriangle, Shield, MessageCircle, Clock, CheckCircle, Mail, Phone, FileText } from 'lucide-react'

export default function DisputePage() {
  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Dispute & Resolution Policy</h1>
          <p className="text-lg text-slate-600">Last updated: March 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Our Commitment to Fair Resolution</h2>
            <p className="text-slate-600 leading-relaxed">
              We strive to provide excellent service every time. If something goes wrong, we're committed to resolving issues quickly and fairly. This policy explains how we handle disputes between customers and service providers.
            </p>
          </section>

          {/* Reporting Issues */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">How to Report an Issue</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MessageCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Step 1: Contact Us Immediately</h3>
                  <p className="text-slate-600">Report the issue within 48 hours of service completion. The sooner we know, the faster we can help.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Step 2: Provide Details</h3>
                  <p className="text-slate-600">Describe the issue in detail. Include photos if possible. This helps us understand and resolve the problem.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Step 3: Allow Time for Investigation</h3>
                  <p className="text-slate-600">We'll investigate and get back to you within 3-5 business days with a resolution.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Types of Issues */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Common Issues We Handle</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-900 mb-2">Service Quality</h3>
                <p className="text-sm text-slate-600">Service not completed to satisfaction</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-900 mb-2">Property Damage</h3>
                <p className="text-sm text-slate-600">Damage to lawn, plants, or property</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-900 mb-2">No-Show</h3>
                <p className="text-sm text-slate-600">Provider failed to arrive</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-900 mb-2">Communication</h3>
                <p className="text-sm text-slate-600">Professional conduct issues</p>
              </div>
            </div>
          </section>

          {/* Resolution Options */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Resolution Options</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-green-900">Service Re-Do</h3>
                  <p className="text-green-700 mt-1">We'll schedule a re-service at no additional cost to ensure your satisfaction.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Shield className="text-blue-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-blue-900">Partial or Full Refund</h3>
                  <p className="text-blue-700 mt-1">Depending on the severity of the issue, we may issue a partial or full refund.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <AlertTriangle className="text-purple-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-purple-900">Account Credit</h3>
                  <p className="text-purple-700 mt-1">We may offer account credit for future services as a gesture of goodwill.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Provider Accountability */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Provider Accountability</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We take service quality seriously. Providers who receive multiple complaints may face:
            </p>
            <ul className="list-disc list-inside text-slate-600 space-y-2 ml-2">
              <li>Temporary suspension from the platform</li>
              <li>Required additional training</li>
              <li>Permanent removal from the platform for severe or repeated issues</li>
              <li>Financial consequences for verified damages</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">How to File a Dispute</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="text-[#22C55E]" size={20} />
                <span>Email: support@mowlist.com</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="text-[#22C55E]" size={20} />
                <span>Call: 1-800-MOWLIST</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MessageCircle className="text-[#22C55E]" size={20} />
                <span>Use the chat feature in our app</span>
              </div>
            </div>
          </section>

          {/* Final Note */}
          <section>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-slate-600 leading-relaxed">
                <strong>Our Promise:</strong> Every dispute is reviewed by a real person. We're committed to fair solutions and continuous improvement. Thank you for helping us maintain high service standards.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
