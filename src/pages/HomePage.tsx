import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Star, Shield, Clock, CreditCard, CheckCircle, ArrowRight, Calendar, RefreshCw, Navigation, Home, Scissors, Clock3, Check, Truck, MapPinned, Phone } from 'lucide-react'

export default function HomePage() {
  const [zipCode, setZipCode] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (zipCode.trim()) {
      navigate(`/book?zip=${zipCode}`)
    }
  }

  // App Tracking Mockup Component - Job Complete State
  const AppTrackingMockup = () => (
    <div className="relative mx-auto max-w-[220px] mt-6">
      {/* Modern Phone Frame - Realistic proportions, thin bezels */}
      <div className="bg-gradient-to-b from-slate-700 to-slate-900 rounded-[2.5rem] p-1.5 shadow-xl border border-slate-600">
        <div className="bg-white rounded-[2.25rem] overflow-hidden">
          {/* Status Bar with Dynamic Island */}
          <div className="bg-black px-4 py-2 flex justify-between items-center">
            <span className="text-white font-medium text-xs">9:41</span>
            <div className="w-20 h-5 bg-black rounded-full flex items-center justify-center">
              <div className="w-12 h-3 bg-slate-900 rounded-full"></div>
            </div>
            <div className="flex gap-1">
              <div className="w-3 h-2 bg-white/40 rounded-sm"></div>
              <div className="w-3 h-2 bg-white/40 rounded-sm"></div>
            </div>
          </div>

          {/* App Header */}
          <div className="bg-white px-3 py-2 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#22C55E] rounded-md flex items-center justify-center">
                  <Scissors className="text-white" size={12} />
                </div>
                <span className="font-bold text-slate-900 text-sm">MowList</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">Status</div>
                <div className="text-xs font-bold text-[#22C55E]">Completed</div>
              </div>
            </div>
          </div>

          {/* Hero Image - Freshly Mowed Lawn */}
          <div className="relative h-28 bg-gradient-to-b from-green-400 to-green-600 flex items-center justify-center">
            {/* Grass Pattern */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 400 176" className="w-full h-full">
                <pattern id="grass" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M0 20 Q5 10 10 20 T20 20" stroke="white" strokeWidth="2" fill="none"/>
                </pattern>
                <rect width="400" height="176" fill="url(#grass)"/>
              </svg>
            </div>

            {/* Completion Badge */}
            <div className="bg-white rounded-full p-3 shadow-lg">
              <div className="w-12 h-12 bg-[#22C55E] rounded-full flex items-center justify-center">
                <Check className="text-white" size={24} />
              </div>
            </div>
          </div>

          {/* Completion Message */}
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white/95 backdrop-blur rounded-full px-3 py-1 shadow-lg">
              <span className="text-xs font-semibold text-slate-900">Job Complete!</span>
            </div>
          </div>

          {/* Service Details Card */}
          <div className="p-3">
            <div className="bg-slate-50 rounded-xl p-3">
              {/* Completion Time */}
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200">
                <Clock className="text-[#22C55E]" size={16} />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Finished at 10:42 AM</div>
                  <div className="text-[10px] text-slate-500">Today</div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 mb-2">
                <MapPinned className="text-[#1E40AF] mt-0.5" size={14} />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">1234 Oak Street</div>
                  <div className="text-[10px] text-slate-500">Austin, TX 78701</div>
                </div>
              </div>

              {/* Service Info */}
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="text-[#22C55E]" size={14} />
                <div>
                  <div className="font-semibold text-slate-900 text-xs">Lawn Mowing + Edging</div>
                  <div className="text-[10px] text-slate-500">Weekly Service</div>
                </div>
              </div>

              {/* Rating Section */}
              <div className="mt-3 p-2 bg-white rounded-lg border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-600">Rate your experience</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="text-yellow-400 fill-current" size={12} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Info */}
            <div className="mt-2 flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-600">MJ</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 text-xs">Mike Johnson</div>
                <div className="text-[10px] text-slate-500">Your lawn pro</div>
              </div>
              <button className="text-[#22C55E] text-xs font-medium">
                Book Again
              </button>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="h-4 bg-white flex items-center justify-center">
            <div className="w-20 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )

  const steps = [
    {
      number: '1',
      title: 'Enter Your Address',
      description: 'Tell us where you live and we\'ll find pros near you',
      icon: MapPin,
    },
    {
      number: '2',
      title: 'Choose Your Service',
      description: 'Select one-time or recurring lawn mowing',
      icon: Calendar,
    },
    {
      number: '3',
      title: 'Book & Relax',
      description: 'Schedule your service and track it in real-time',
      icon: Clock,
    },
  ]

  const features = [
    {
      icon: Shield,
      title: 'Vetted Professionals',
      description: 'All lawn pros are background-checked and insured',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Pay safely online. Money held until job is done',
    },
    {
      icon: Clock,
      title: 'Real-Time Tracking',
      description: 'See when your pro is on the way and arrive',
    },
    {
      icon: RefreshCw,
      title: 'Easy Recurring',
      description: 'Set it and forget it with weekly or biweekly service',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah J.',
      location: 'Austin, TX',
      rating: 5,
      text: 'MowList made it so easy to find a reliable lawn pro. The booking process was seamless!',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    },
    {
      name: 'Michael C.',
      location: 'Denver, CO',
      rating: 5,
      text: 'Finally, an app that works! My lawn has never looked better. Highly recommend MowList.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    {
      name: 'Emily R.',
      location: 'Phoenix, AZ',
      rating: 5,
      text: 'The recurring service is a game changer. My lawn looks great every week without me having to do anything!',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    },
  ]

  return (
    <div className="pt-16">
      {/* Hero Section - Mobile: Stacked layout | Desktop: Full background */}
      <section className="relative min-h-auto lg:min-h-[700px] overflow-hidden">
        {/* Mobile: White background section with text */}
        <div className="bg-white lg:hidden">
          <div className="px-4 py-8">
            {/* Brand Block */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-3">
                Find a trusted local <span className="text-[#22C55E]">lawn pro</span> in minutes
              </h1>
              <p className="text-base text-slate-600 mb-6">
                Book one-time or recurring lawn mowing, get service updates in real time, and keep your yard handled even when you're not home.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Enter your zip code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#22C55E] focus:border-transparent text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#22C55E] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2"
                  >
                    <Search size={18} />
                    Get Started
                  </button>
                </div>
              </form>

              {/* Trust Badges - Simplified for mobile */}
              <div className="flex flex-wrap justify-center gap-4 text-slate-600">
                <div className="flex items-center gap-1.5 text-xs">
                  <Calendar className="text-[#22C55E]" size={14} />
                  <span>Easy Booking</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="text-[#22C55E]" size={14} />
                  <span>Real-Time</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <RefreshCw className="text-[#22C55E]" size={14} />
                  <span>Weekly</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image Section - Mobile: Below text | Desktop: Full background */}
        <div className="relative h-64 lg:h-auto lg:absolute lg:inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat lg:bg-cover"
            style={{ backgroundImage: 'url(/hero-lawn-care.jpg)' }}
          />
          {/* Gradient overlay for desktop only */}
          <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        </div>

        {/* Desktop-only text content */}
        <div className="hidden lg:relative lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
                Find a trusted local <br/>
                <span className="text-[#22C55E]">lawn pro</span> in minutes
              </h1>
              <p className="text-xl text-white/90 mb-10 max-w-xl mx-auto lg:mx-0 drop-shadow-md">
                Book one-time or recurring lawn mowing, get service updates in real time, and keep your yard handled even when you're not home.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl mx-auto lg:mx-0 mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Enter your zip code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#22C55E] focus:border-transparent text-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#22C55E] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2"
                  >
                    <Search size={20} />
                    Get Started
                  </button>
                </div>
              </form>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-white">
                <div className="flex items-center gap-2">
                  <Calendar className="text-[#22C55E]" size={20} />
                  <span className="font-medium">Easy Online Booking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-[#22C55E]" size={20} />
                  <span className="font-medium">Real-Time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="text-[#22C55E]" size={20} />
                  <span className="font-medium">Weekly or Biweekly</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block" />
          </div>
        </div>
      </section>

      {/* For Pros Banner */}
      <section className="py-12 bg-gradient-to-r from-[#1E40AF] to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Are you a lawn care pro?
              </h2>
              <p className="text-blue-100 text-lg">
                Grow your business. Set your own schedule. Get paid weekly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup/pro"
                className="bg-[#22C55E] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors text-center whitespace-nowrap"
              >
                Start Earning
              </Link>
              <Link
                to="/login/pro"
                className="bg-white/10 backdrop-blur text-white border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors text-center whitespace-nowrap"
              >
                I'm Already a Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600">Get your lawn maintained in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <step.icon className="text-[#22C55E]" size={32} />
                </div>
                <div className="text-[#22C55E] font-bold text-xl mb-2">Step {step.number}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Homeowners Trust MowList</h2>
            <p className="text-xl text-slate-600">We make lawn care simple, reliable, and hassle-free</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="text-[#22C55E]" size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Track Your Service in Real Time */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: App Mockup */}
            <div className="order-2 lg:order-1">
              <AppTrackingMockup />
            </div>

            {/* Right: Text Content */}
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Track your service in <span className="text-[#22C55E]">real time</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Never wonder when your pro will arrive. Get instant updates on their way, watch them complete the job, and rate your experience — all from your phone.
              </p>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                  <span className="text-slate-700">See when your pro is on the way with live tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                  <span className="text-slate-700">Get notified when work begins and when it's complete</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                  <span className="text-slate-700">Rate your experience and book again with one tap</span>
                </li>
              </ul>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors"
              >
                Book Your First Service <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recurring Service */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Recurring Service, <span className="text-[#22C55E]">Made Easy</span>
              </h2>
              <p className="text-xl text-slate-600 mb-6">
                Set up weekly or biweekly service and never worry about mowing again. Skip, pause, or cancel anytime.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-[#22C55E]" size={20} />
                  <span className="text-slate-700">Consistent, reliable service</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-[#22C55E]" size={20} />
                  <span className="text-slate-700">Skip a visit when you need to</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-[#22C55E]" size={20} />
                  <span className="text-slate-700">Same pro every time when possible</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="text-[#22C55E]" size={20} />
                  <span className="text-slate-700">Easy online management</span>
                </li>
              </ul>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors"
              >
                Book Recurring Service <ArrowRight size={20} />
              </Link>
            </div>
            <div className="bg-green-50 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Sample Weekly Pricing</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">Small Yard</span>
                    <span className="font-semibold text-[#22C55E]">$35/week</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">Medium Yard</span>
                    <span className="font-semibold text-[#22C55E]">$45/week</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">Large Yard</span>
                    <span className="font-semibold text-[#22C55E]">$65/week</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4">One-time service also available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-slate-600">Join thousands of happy homeowners</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-500 fill-current" size={18} />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#1E40AF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Lawn?
          </h2>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Join thousands of homeowners who trust MowList for their lawn care needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/book"
              className="bg-[#22C55E] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-[#16A34A] transition-colors"
            >
              Book Lawn Service
            </Link>
            <Link
              to="/for-pros"
              className="bg-white text-[#1E40AF] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Join as a Pro
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
