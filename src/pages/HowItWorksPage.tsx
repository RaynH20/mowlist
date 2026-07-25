import { Link } from 'react-router-dom'
import { MapPin, Calendar, Clock, Shield, CreditCard, CheckCircle, ArrowRight, Star } from 'lucide-react'

export default function HowItWorksPage() {
  const steps = [
    {
      number: 1,
      title: 'Enter Your Address',
      description: 'Simply enter your address or zip code to find lawn care professionals in your area.',
      icon: MapPin,
    },
    {
      number: 2,
      title: 'Choose Your Service',
      description: 'Select one-time mowing or set up recurring weekly or biweekly service.',
      icon: Calendar,
    },
    {
      number: 3,
      title: 'Pick a Time',
      description: 'Choose a convenient date and time that works for your schedule.',
      icon: Clock,
    },
    {
      number: 4,
      title: 'Pay Securely',
      description: 'Enter your payment information. Money is held until the job is complete.',
      icon: CreditCard,
    },
    {
      number: 5,
      title: 'Track in Real-Time',
      description: 'See when your pro is on the way, has arrived, and is mowing.',
      icon: Shield,
    },
    {
      number: 6,
      title: 'Relax & Enjoy',
      description: 'Your lawn looks great! Get a completion photo and rate your experience.',
      icon: CheckCircle,
    },
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Vetted Professionals',
      description: 'All providers are background-checked and fully insured.',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Your payment is held securely until the job is done.',
    },
    {
      icon: Star,
      title: 'Satisfaction Guaranteed',
      description: 'Not happy? We\'ll make it right or refund your service.',
    },
    {
      icon: Clock,
      title: 'Real-Time Updates',
      description: 'Track your service from start to finish.',
    },
  ]

  const faqs = [
    {
      question: 'How does MowList work?',
      answer: 'MowList connects homeowners with local lawn care professionals. Enter your address, choose your service, pick a time, and book. Your pro will arrive, mow your lawn, and you\'ll get a completion photo.',
    },
    {
      question: 'Are the providers verified?',
      answer: 'Yes! All pros go through background checks, identity verification, and insurance verification before they can accept jobs on our platform.',
    },
    {
      question: 'How does payment work?',
      answer: 'Your payment is authorized when you book but only charged after the service is completed. We hold the funds to ensure your satisfaction.',
    },
    {
      question: 'Can I cancel or reschedule?',
      answer: 'Yes, you can cancel or reschedule up to 24 hours before your scheduled appointment without any fees.',
    },
    {
      question: 'What if it rains?',
      answer: 'If weather prevents service, your pro will reschedule to the next available slot. You\'ll be notified automatically.',
    },
  ]

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            How <span className="text-[#22C55E]">MowList</span> Works
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Getting your lawn professionally maintained has never been easier. Follow these simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-[#22C55E] text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <step.icon className="text-[#22C55E]" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="py-16 bg-slate-50 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Choose MowList?</h2>
            <p className="text-xl text-slate-600">We make lawn care simple, safe, and satisfying</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <benefit.icon className="text-[#22C55E]" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-slate-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600">Got questions? We've got answers</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-slate-600 mb-8">Join thousands of happy homeowners</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book"
              className="bg-[#22C55E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#16A34A] transition-colors inline-flex items-center gap-2"
            >
              Book Now <ArrowRight size={20} />
            </Link>
            <Link
              to="/signup"
              className="bg-[#1E40AF] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#1E3A8A] transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
