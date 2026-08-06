import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, MapPin, Star, Shield, Clock, CheckCircle, ArrowRight,
  Scissors, Calendar, Pause, CreditCard, Sparkles, Award,
  Phone, MessageCircle, ChevronDown, TrendingUp
} from 'lucide-react'

export default function HomePage() {
  const [zipCode, setZipCode] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (zipCode.trim()) {
      navigate(`/book?zip=${zipCode}`)
    } else {
      navigate('/book')
    }
  }

  const faqs = [
    {
      q: 'How much does it cost?',
      a: 'Pricing depends on your lawn size and frequency. Lawn mowing only starts at $35 for a one-time visit of a small yard, or $31/week for weekly service. Add edge trimming (+$8), driveway blow-off (+$5), or hedge trimming (+$25) at checkout. You see the full price upfront — no surprise fees.',
    },
    {
      q: 'How do I know the pros are trustworthy?',
      a: 'Every pro on MowList is background-checked, identity-verified through Stripe Connect, and reviewed by customers after every job. Pros keep a public rating. If a pro\'s rating drops below 4.5 stars, they\'re removed from the platform.',
    },
    {
      q: 'Do I need to be home?',
      a: 'No. Most customers aren\'t home during service. As long as your pro has access to the yard, they\'ll handle everything and send you a photo when done.',
    },
    {
      q: 'Can I skip a week or cancel anytime?',
      a: 'Yes. Weekly and bi-weekly customers can skip any week, pause for a season, or cancel — no fees, no questions. One-time bookings can be rescheduled up to 24 hours before the visit.',
    },
    {
      q: 'When do I get charged?',
      a: 'You\'re charged only after the job is complete. The pro marks the job done in the app, Stripe processes the payment, and you get a receipt by email. MowList takes a 15% service fee, the rest goes to your pro.',
    },
    {
      q: 'What if I\'m not happy with the service?',
      a: 'Reach out within 24 hours and we\'ll re-mow for free or refund the full amount. We stand behind every job.',
    },
  ]

  return (
    <div className="bg-white">
      {/* ================================================================
          HERO — full-width with background image, dark overlay
          ================================================================ */}
      <section className="relative min-h-[680px] md:min-h-[760px] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-lawn.jpg)' }}
          aria-hidden="true"
        />
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/80" aria-hidden="true" />
        {/* Subtle green tint at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#22C55E]/20 to-transparent" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 w-full">
          <div className="max-w-3xl">
            {/* Trust badge above headline */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={14} className="text-[#22C55E]" />
              Trusted by 2,500+ homeowners across Texas
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              Your lawn,
              <br />
              <span className="text-[#22C55E]">professionally mowed.</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl leading-relaxed">
              Book a vetted local pro in 60 seconds. Flat pricing, no contracts, no surprises — just a great-looking yard.
            </p>

            {/* CTAs + zip */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <form onSubmit={handleSearch} className="flex-1 max-w-md flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Enter your ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-slate-900 bg-white shadow-lg focus:ring-2 focus:ring-[#22C55E] focus:outline-none"
                    inputMode="numeric"
                    maxLength={5}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Get Quote
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-200">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="font-semibold text-white">4.9</span>
                <span>average rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-[#22C55E]" />
                <span>100% vetted, insured pros</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-[#22C55E]" />
                <span>No commitment, cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:block">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ================================================================
          STATS BAR — thin strip with 4 big numbers
          ================================================================ */}
      <section className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { num: '2,500+', label: 'Lawns mowed' },
              { num: '500+', label: 'Vetted pros' },
              { num: '4.9 ★', label: 'Avg rating' },
              { num: '24hr', label: 'Free re-mow guarantee' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#22C55E] mb-1">{s.num}</div>
                <div className="text-sm text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS — 3 steps
          ================================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              A great-looking lawn in <span className="text-[#22C55E]">3 simple steps</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No phone calls, no contracts, no haggling. Book online and we'll handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connector line on desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden="true" />

            {[
              {
                step: '1',
                icon: Calendar,
                title: 'Book in 60 seconds',
                desc: 'Enter your ZIP, pick your service, choose a date. See the price upfront — what you see is what you pay.',
              },
              {
                step: '2',
                icon: Phone,
                title: 'Get matched instantly',
                desc: 'A vetted local pro claims your job within minutes. See their profile, rating, and reviews before they arrive.',
              },
              {
                step: '3',
                icon: Scissors,
                title: 'Sit back, enjoy',
                desc: 'Your pro handles everything. Get a notification when they\'re done, with photos. Pay only after — no subscription required.',
              },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-[#22C55E] rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4 relative z-10">
                    {s.step}
                  </div>
                  <s.icon className="text-slate-400 mb-3" size={28} />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          BEFORE/AFTER — big visual proof
          ================================================================ */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/before-after.jpg"
                  alt="Lawn before and after MowList service"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 md:order-2">
              <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">The proof</p>
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                From overgrown to <span className="text-[#22C55E]">Instagram-worthy</span> in one visit.
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                The average MowList customer goes from "I should really mow this" to "my neighbors are asking who does my lawn" within a week of their first booking.
              </p>
              <ul className="space-y-3">
                {[
                  'Fresh mow with sharp blades (no torn tips)',
                  'Edges trimmed along walkways and beds',
                  'Hard surfaces blown clean',
                  'Grass clippings removed from beds and curbs',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700">
                    <CheckCircle size={20} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          WHY MOWLIST — 4 value props in a grid
          ================================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Why MowList</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Better than the guy down the street.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Old-school lawn care is unreliable, uninsured, and quote-by-quote. We're not that.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: 'Vetted Pros',
                desc: 'Every pro is background-checked, identity-verified, and reviewed by customers after every job.',
              },
              {
                icon: TrendingUp,
                title: 'Upfront Pricing',
                desc: 'See the full price before you book. Lawn mowing only, plus optional add-ons. No surprise fees.',
              },
              {
                icon: Calendar,
                title: 'Flexible Schedule',
                desc: 'Skip a week, pause for vacation, or change your service. Manage everything from your phone.',
              },
              {
                icon: CreditCard,
                title: 'Secure Payments',
                desc: 'Powered by Stripe. You only pay after the job is done. Refunded if you\'re not happy.',
              },
            ].map((b, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:border-[#22C55E] hover:shadow-md transition-all">
                <div className="w-11 h-11 bg-[#22C55E]/10 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="text-[#22C55E]" size={22} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{b.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          PRO SPOTLIGHT — person + image, "meet your pro" feel
          ================================================================ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">The people behind the mower</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Real pros. Real neighbors. <span className="text-[#22C55E]">Real accountability.</span>
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                MowList pros are independent local lawn care businesses. They have skin in the game — their reputation, their earnings, their next booking all depend on doing right by you.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-[#22C55E] mb-1">$50k+</div>
                  <div className="text-sm text-slate-400">Avg annual earnings per pro</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#22C55E] mb-1">4.9 ★</div>
                  <div className="text-sm text-slate-400">Avg pro rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#22C55E] mb-1">94%</div>
                  <div className="text-sm text-slate-400">Pros who stay year-over-year</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#22C55E] mb-1">2 days</div>
                  <div className="text-sm text-slate-400">Avg time to first paid job</div>
                </div>
              </div>
              <Link
                to="/for-pros"
                className="inline-flex items-center gap-2 mt-8 text-[#22C55E] hover:text-white font-semibold transition-colors"
              >
                Learn how to become a MowList pro
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="/pro-at-work.jpg"
                  alt="MowList pro at work"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          PRICING TEASER — 3 plans, link to full pricing
          ================================================================ */}
      <section className="py-20 md:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Simple, flat pricing. <span className="text-[#22C55E]">No surprises.</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Lawn mowing only. Add extras at checkout. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {[
              { name: 'One-time', price: '$45', unit: 'visit', desc: 'Perfect for a quick cleanup', highlight: false },
              { name: 'Weekly', price: '$31', unit: '/week', desc: 'Most popular — save every visit', highlight: true },
              { name: 'Monthly', price: '$28', unit: '/visit', desc: 'For slow-growing lawns', highlight: false },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-6 ${
                  plan.highlight
                    ? 'bg-[#1E40AF] text-white ring-4 ring-[#1E40AF] ring-offset-4 ring-offset-slate-50'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block text-xs font-bold bg-[#22C55E] text-white px-2 py-0.5 rounded-full mb-2">
                    Most popular
                  </span>
                )}
                <h3 className={`text-lg font-semibold mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-3">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? 'text-blue-200' : 'text-slate-500'}`}>
                    {plan.unit}
                  </span>
                </div>
                <p className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-600'}`}>
                  {plan.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              See full pricing & add-ons
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS — 3 social proof cards
          ================================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">Customers love us</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              4.9 stars across 1,000+ reviews
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "I used to spend every Saturday mowing. Now I spend it at the lake. MowList pro shows up, does the work, sends me a photo. Done.",
                name: 'Sarah M.',
                location: 'Austin, TX',
                tenure: 'Customer for 6 months',
              },
              {
                quote: "I manage 4 rental properties and MowList handles all of them. Pricing is consistent, pros are reliable, and the app makes it easy to schedule. 10/10.",
                name: 'James T.',
                location: 'Round Rock, TX',
                tenure: 'Property manager',
              },
              {
                quote: "Honestly didn't expect much for the price. But the lawn looks better than when I did it myself. The pro even flagged a sprinkler issue I didn't know about.",
                name: 'Priya K.',
                location: 'Cedar Park, TX',
                tenure: 'Customer for 3 months',
              },
            ].map((t, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-5 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22C55E] to-[#1E40AF] flex items-center justify-center text-white font-semibold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.location} · {t.tenure}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          APP INFOGRAPHIC — phone mockup with feature
          ================================================================ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-[#22C55E] to-[#16A34A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider mb-2 text-white/80">Manage from anywhere</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Your lawn on autopilot.
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Skip a week, change your service, see photos from your last mow, message your pro — all from the MowList app.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'One-tap reschedule when life happens',
                  'See your pro\'s photo and ETA on visit day',
                  'Before/after photos after every service',
                  'Manage multiple properties from one account',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={14} />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 bg-white text-[#16A34A] hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl shadow-md transition-all"
              >
                Start your first booking
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl ring-8 ring-white/20">
                <img
                  src="/infographic-app.jpg"
                  alt="MowList app interface"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ — collapsible
          ================================================================ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[#22C55E] uppercase tracking-wider mb-2">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Common questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => {
              const isOpen = openFaq === i
              return (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-semibold text-slate-900">{f.q}</span>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-slate-600 leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ================================================================
          FINAL CTA — last big push
          ================================================================ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-slate-900 via-slate-900 to-[#1E40AF] text-white relative overflow-hidden">
        {/* Decorative gradient blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#22C55E]/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#1E40AF]/30 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Award className="text-[#22C55E] mx-auto mb-6" size={48} />
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Your weekends back.
            <br />
            <span className="text-[#22C55E]">Starting at $35.</span>
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join 2,500+ homeowners who never mow their own lawn anymore. First booking takes 60 seconds.
          </p>

          <form onSubmit={handleSearch} className="max-w-md mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl shadow-2xl">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter your ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-900 bg-slate-50 focus:ring-2 focus:ring-[#22C55E] focus:outline-none focus:bg-white"
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              <button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Get My Quote
                <ArrowRight size={18} />
              </button>
            </div>
          </form>

          <p className="text-sm text-slate-400">
            No credit card needed. No commitment. Cancel anytime.
          </p>
        </div>
      </section>
    </div>
  )
}
