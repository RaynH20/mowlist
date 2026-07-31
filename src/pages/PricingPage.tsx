import { Link } from 'react-router-dom'
import { CheckCircle, Plus } from 'lucide-react'

export default function PricingPage() {
  // Plans are LAWN MOWING ONLY. Edge trimming, driveway blow-off, hedge
  // trimming, and leaf removal are listed as add-ons below — not bundled
  // into the base price.
  const plans = [
    {
      name: 'One-Time',
      description: 'Perfect for occasional service or a quick cleanup',
      price: 'from $45',
      priceUnit: '/visit',
      features: [
        'Professional lawn mowing',
        'Grass clipping blow-off of hard surfaces',
        'Vetted local pro',
        'Satisfaction guaranteed',
      ],
      cta: 'Book Now',
      highlighted: false,
    },
    {
      name: 'Weekly',
      description: 'Best for consistent lawn care',
      price: 'from $31',
      priceUnit: '/week',
      features: [
        'Professional lawn mowing every week',
        'Same pro when available',
        'Skip anytime',
        'Easy rescheduling',
        'Priority support',
        'Save vs. one-time',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Bi-Weekly',
      description: 'Great for growing seasons',
      price: 'from $33',
      priceUnit: '/visit',
      features: [
        'Professional lawn mowing every two weeks',
        'Same pro when available',
        'Skip anytime',
        'Easy rescheduling',
        'Priority support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Monthly',
      description: 'Lowest maintenance, for slow-growing lawns',
      price: 'from $28',
      priceUnit: '/visit',
      features: [
        'Professional lawn mowing once a month',
        'Same pro when available',
        'Skip anytime',
        'Easy rescheduling',
        'Priority support',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
  ]

  // Base prices are LAWN MOWING ONLY. Add-on prices are added on top.
  const yardSizes = [
    { size: 'Small', sqft: '< 5,000', weekly: '$31', biweekly: '$33', monthly: '$28', oneTime: '$45' },
    { size: 'Medium', sqft: '5,000 - 10,000', weekly: '$41', biweekly: '$43', monthly: '$38', oneTime: '$55' },
    { size: 'Large', sqft: '10,000+', weekly: '$61', biweekly: '$62', monthly: '$56', oneTime: '$85' },
  ]

  // Optional services — added to any plan for an extra fee.
  const addOns = [
    { name: 'Edge trimming', price: '+$8', desc: 'Clean, crisp edges along walkways, driveways, and beds.' },
    { name: 'Driveway & sidewalk blow-off', price: '+$5', desc: 'Hard surfaces cleared of clippings after every mow.' },
    { name: 'Hedge trimming', price: 'from +$25', desc: 'Shape and clean up small to medium hedges.' },
    { name: 'Leaf removal', price: 'from +$35', desc: 'Seasonal cleanup of fallen leaves from lawn and beds.' },
    { name: 'Fertilization', price: 'from +$45', desc: 'Seasonal feed for greener, thicker grass. (Coming soon)' },
  ]

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Simple, <span className="text-[#22C55E]">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Lawn mowing at a fair price. Add extra services only when you need them.
          </p>
        </div>

        {/* Pricing Plans — 4 across on desktop */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 flex flex-col ${
                  plan.highlighted
                    ? 'bg-[#1E40AF] text-white ring-4 ring-[#1E40AF] ring-offset-2 lg:scale-105'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-semibold bg-[#22C55E] text-white px-2 py-0.5 rounded-full mb-2 self-start">
                    Most popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
                <div className="mb-5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                    {plan.priceUnit}
                  </span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={16} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
                      <span className={plan.highlighted ? 'text-blue-100' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/book"
                  className="block text-center py-2.5 rounded-lg font-medium transition-colors bg-[#22C55E] text-white hover:bg-[#16A34A]"
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Yard Size Pricing */}
        <div className="py-12 bg-slate-50 rounded-2xl">
          <div className="text-center mb-8 px-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Pricing by Yard Size</h2>
            <p className="text-slate-600">Lawn mowing only. Add extras at checkout.</p>
          </div>
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-900">Yard Size</th>
                    <th className="text-left p-4 font-semibold text-slate-900">Weekly</th>
                    <th className="text-left p-4 font-semibold text-slate-900">Bi-Weekly</th>
                    <th className="text-left p-4 font-semibold text-slate-900">Monthly</th>
                    <th className="text-left p-4 font-semibold text-slate-900">One-Time</th>
                  </tr>
                </thead>
                <tbody>
                  {yardSizes.map((yard, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{yard.size}</div>
                        <div className="text-sm text-slate-500">{yard.sqft} sqft</div>
                      </td>
                      <td className="p-4 text-[#22C55E] font-semibold">{yard.weekly}</td>
                      <td className="p-4 text-[#22C55E] font-semibold">{yard.biweekly}</td>
                      <td className="p-4 text-[#22C55E] font-semibold">{yard.monthly}</td>
                      <td className="p-4 text-[#22C55E] font-semibold">{yard.oneTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add-ons */}
        <div className="py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Add-Ons</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Need more than just mowing? Add any of these to any plan.
              You can mix and match per visit.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {addOns.map((addon, index) => (
              <div
                key={index}
                className="bg-white border-2 border-slate-200 rounded-xl p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Plus size={16} className="text-[#22C55E]" />
                    {addon.name}
                  </h3>
                  <span className="text-[#22C55E] font-bold whitespace-nowrap">{addon.price}</span>
                </div>
                <p className="text-sm text-slate-600">{addon.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="py-12">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Pricing Questions?</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">What's included in the base price?</h3>
                <p className="text-slate-600">Professional lawn mowing and basic grass-clipping blow-off of hard surfaces. Edge trimming, hedge work, leaf removal, and other extras are listed above as add-ons.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Do I need to be home?</h3>
                <p className="text-slate-600">No! Most customers aren't home during service. We'll send you updates and a completion photo when we're done.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-slate-600">Yes. You can cancel or pause recurring service anytime with no fees. One-time bookings can be rescheduled up to 24 hours before your visit.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">What about really big or weird yards?</h3>
                <p className="text-slate-600">Properties over 12,000 sq ft or with unusual features typically run $80-$150+ per visit. Use our custom quote form and we'll get back to you with a fair price.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
