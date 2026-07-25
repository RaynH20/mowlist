export default function FAQPage() {
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
    {
      question: 'Do I need to be home?',
      answer: 'No! Many of our customers are not home during service. We\'ll send you updates and a completion photo when done.',
    },
    {
      question: 'How does recurring service work?',
      answer: 'Set up weekly or biweekly service and we\'ll automatically schedule your appointments. You can skip, pause, or cancel anytime.',
    },
    {
      question: 'What if I\'m not satisfied?',
      answer: 'We\'re committed to your satisfaction. Contact us within 24 hours of service and we\'ll make it right or refund your service.',
    },
  ]

  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Frequently Asked <span className="text-[#22C55E]">Questions</span>
          </h1>
          <p className="text-xl text-slate-600">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{faq.question}</h3>
              <p className="text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
