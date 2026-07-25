import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CheckCircle, Clock, Star, Phone, Mail, MessageCircle, AlertTriangle, RefreshCw, FileText, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

export default function SafetyPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: Shield,
      title: 'Vetted Professionals',
      description: 'All lawn pros undergo comprehensive background checks, identity verification, and insurance validation before accepting jobs.',
    },
    {
      icon: CheckCircle,
      title: 'Verified Insurance',
      description: 'All service providers must maintain liability insurance for your protection.',
    },
    {
      icon: Clock,
      title: 'Real-Time Tracking',
      description: 'Know exactly when your pro is arriving with live status updates.',
    },
    {
      icon: Star,
      title: 'Rating System',
      description: 'Transparent ratings and reviews help maintain service quality.',
    },
  ]

  const policies = [
    {
      title: 'Service Guarantee',
      content: 'We stand behind every service. If you\'re not satisfied, we\'ll make it right — free of charge. Our goal is 100% customer satisfaction on every job.',
    },
    {
      title: 'Cancellation Policy',
      content: 'You can cancel any booking free of charge up to 24 hours before the scheduled service time. Cancellations within 24 hours may incur a small fee to cover provider planning time.',
    },
    {
      title: 'Refund Policy',
      content: 'If a service isn\'t completed to your satisfaction, we offer full or partial refunds based on the situation. Disputed charges are held in escrow until the issue is resolved.',
    },
    {
      title: 'Dispute Resolution',
      content: 'We take disputes seriously. Our support team reviews all issues within 48 hours. Funds are held securely until both parties reach an agreement or our team makes a final determination.',
    },
    {
      title: 'Provider Vetting',
      content: 'Every lawn pro passes: criminal background check, identity verification, insurance validation, and reference review. We re-verify insurance annually.',
    },
    {
      title: 'Photo Completion Proof',
      content: 'Providers upload before and after photos for every job. You\'ll receive a notification when service is complete with proof of quality work.',
    },
  ]

  const supportOptions = [
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Mon-Fri 9am-6pm',
      action: 'Call Us',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: '24/7 response',
      action: 'Email Us',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Instant help',
      action: 'Start Chat',
    },
  ]

  const faqs = [
    {
      question: 'How are providers vetted?',
      answer: 'All providers undergo criminal background checks, identity verification, insurance validation, and reference checks before being approved to work on MowList.',
    },
    {
      question: 'What if something goes wrong?',
      answer: 'Contact our support team immediately. We\'ll work with you and the provider to resolve any issues, including refunds if necessary.',
    },
    {
      question: 'How do payments work?',
      answer: 'Payments are processed securely after service completion. Funds are held in escrow until you confirm the job is done to your satisfaction.',
    },
    {
      question: 'Can I get a refund?',
      answer: 'Yes, we offer full refunds if service isn\'t completed as promised. Simply contact us within 48 hours of the service to file a refund request.',
    },
  ]

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Trust & <span className="text-[#22C55E]">Safety</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Your safety and peace of mind are our top priorities. Learn how we protect you on every job.
          </p>
        </div>

        {/* Trust Features */}
        <div className="py-8 space-y-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-6 flex gap-4">
              <div className="w-12 h-12 bg-[#22C55E] text-white rounded-full flex items-center justify-center flex-shrink-0">
                <feature.icon size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Policies Section */}
        <div className="py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Our Policies</h2>
          <div className="grid gap-4">
            {policies.map((policy, index) => (
              <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{policy.title}</h3>
                  <div className="w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center">
                    <CheckCircle className="text-white" size={16} />
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-slate-600">{policy.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Section */}
        <div className="py-12 bg-gradient-to-br from-slate-50 to-green-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Need Help?</h2>
          <p className="text-slate-600 text-center mb-8">
            Our support team is here to help with any questions or concerns.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {supportOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-[#22C55E] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <option.icon size={24} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{option.title}</h3>
                <p className="text-slate-500 text-sm mb-4">{option.description}</p>
                <Link
                  to="/contact"
                  className="inline-block text-[#22C55E] font-medium hover:underline"
                >
                  {option.action}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-lg">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium text-slate-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="text-slate-400" size={20} />
                  ) : (
                    <ChevronDown className="text-slate-400" size={20} />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="py-8 border-t border-slate-200">
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/cancellation" className="text-[#22C55E] hover:underline flex items-center gap-2">
              <FileText size={16} />
              Cancellation Policy
            </Link>
            <Link to="/refund" className="text-[#22C55E] hover:underline flex items-center gap-2">
              <RefreshCw size={16} />
              Refund Policy
            </Link>
            <Link to="/dispute" className="text-[#22C55E] hover:underline flex items-center gap-2">
              <AlertTriangle size={16} />
              Dispute Resolution
            </Link>
            <Link to="/contact" className="text-[#22C55E] hover:underline flex items-center gap-2">
              <MessageCircle size={16} />
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
