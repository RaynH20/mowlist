import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'One-Time',
      description: 'Perfect for occasional service',
      price: null,
      features: [
        'Single service visit',
        'Professional mowing',
        'Edge trimming',
        'Driveway blow-off',
        'atisfaction guaranteed',
      ],
      cta: 'Book Now',
      highlighted: false,
    },
    {
      name: 'Weekly',
      description: 'Best for consistent lawn care',
      price: 'from $31/week',
      features: [
        'Every week service',
        'Same pro when available',
        'Skip anytime',
        'Easy rescheduling',
        'Priority support',
        '10% savings',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Bi-Weekly',
      description: 'Great for growing seasons',
      price: 'from $38/visit',
      features: [
        'Every two weeks',
        'Same pro when available',
        'Skip anytime',
        'Easy rescheduling',
        'Priority support',
        '5% savings',
      ],
      cta: 'Get Started',
      highlighted: false,
    },
  ]

  const yardSizes = [
    { size: 'Small', sqft: '< 5,000', weekly: '$35', biweekly: '$33', oneTime: '$45' },
    { size: 'Medium', sqft: '5,000 - 10,000', weekly: '$45', biweekly: '$43', oneTime: '$55' },
    { size: 'Large', sqft: '10,000+', weekly: '$65', biweekly: '$62', oneTime: '$85' },
  ]

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Simple, <span className="text-[#22C55E]">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            No hidden fees. No surprises. Just reliable lawn care at a fair price.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-[#1E40AF] text-white ring-4 ring-[#1E40AF] ring-offset-2'
                    : 'bg-white border-2 border-slate-200'
                }`}
              >
                <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-blue-200' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
                {plan.price && (
                  <div className="text-3xl font-bold mb-6">{plan.price}</div>
                )}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle size={18} className={plan.highlighted ? 'text-[#22C55E]' : 'text-[#22C55E]'} />
                      <span className={plan.highlighted ? 'text-blue-100' : 'text-slate-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/book"
                  className={`block text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                      : 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Yard Size Pricing */}
        <div className="py-16 bg-slate-50 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Pricing by Yard Size</h2>
            <p className="text-slate-600">Simple pricing based on your lawn size</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-900">Yard Size</th>
                    <th className="text-left p-4 font-semibold text-slate-900">Weekly</th>
                    <th className="text-left p-4 font-semibold text-slate-900">Bi-Weekly</th>
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
                      <td className="p-4 text-[#22C55E] font-semibold">{yard.biweekly || '-'}</td>
                      <td className="p-4 text-[#22C55E] font-semibold">{yard.oneTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="py-16">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Pricing Questions?</h2>
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">What's included in the price?</h3>
                <p className="text-slate-600">Standard mowing, edge trimming, and blowing off hard surfaces. Additional services like leaf removal available at extra cost.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Do I need to be home?</h3>
                <p className="text-slate-600">No! Many of our customers are not home during service. We'll send you updates and a completion photo when done.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Can I cancel anytime?</h3>
                <p className="text-slate-600">Yes! You can cancel or pause recurring service anytime with no fees.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
