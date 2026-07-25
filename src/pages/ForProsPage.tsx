import { Link } from 'react-router-dom'
import { DollarSign, Calendar, Star, MapPin, ArrowRight, CheckCircle, Clock, Shield } from 'lucide-react'

export default function ForProsPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn More',
      description: 'Set your own prices and keep more of what you earn.',
    },
    {
      icon: Calendar,
      title: 'Flexible Schedule',
      description: 'Work when you want. Accept or decline jobs based on your availability.',
    },
    {
      icon: MapPin,
      title: 'Steady Work',
      description: 'Access a steady stream of customers in your service area.',
    },
    {
      icon: Star,
      title: 'Build Your Reputation',
      description: 'Collect ratings and reviews to attract more customers.',
    },
  ]

  const requirements = [
    'Valid driver\'s license',
    'Own lawn care equipment',
    'Smartphone with data plan',
    'Reliable transportation',
    'Background check approval',
    'Proof of insurance',
  ]

  const howItWorks = [
    { step: 1, title: 'Apply Online', description: 'Fill out our provider application.' },
    { step: 2, title: 'Verify & Onboard', description: 'Complete background check and training.' },
    { step: 3, title: 'Start Earning', description: 'Accept jobs and grow your business!' },
  ]

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Become a <span className="text-[#22C55E]">MowList Pro</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Join thousands of lawn care professionals growing their business with MowList. Set your own schedule and prices.
          </p>
          <Link
            to="/signup/pro"
            className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#16A34A] transition-colors"
          >
            Apply Now <ArrowRight size={20} />
          </Link>
        </div>

        {/* Benefits */}
        <div className="py-16 bg-slate-50 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Join MowList?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="text-[#22C55E]" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How to Get Started</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-[#22C55E] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="py-16 bg-slate-50 rounded-2xl">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Provider Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg">
                  <CheckCircle className="text-[#22C55E] flex-shrink-0" size={20} />
                  <span className="text-slate-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to Grow Your Business?</h2>
          <Link
            to="/signup/pro"
            className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#16A34A] transition-colors"
          >
            Apply Now <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  )
}
