import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="pt-24 pb-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Contact <span className="text-[#22C55E]">Us</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We'd love to hear from you. Get in touch with our team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-slate-50 rounded-xl">
            <Mail className="w-10 h-10 text-[#22C55E] mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">Email</h3>
            <p className="text-slate-600">hello@mowlist.com</p>
          </div>
          <div className="text-center p-6 bg-slate-50 rounded-xl">
            <Phone className="w-10 h-10 text-[#22C55E] mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">Phone</h3>
            <p className="text-slate-600">1-800-MOW-LIST</p>
          </div>
          <div className="text-center p-6 bg-slate-50 rounded-xl">
            <MapPin className="w-10 h-10 text-[#22C55E] mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">Address</h3>
            <p className="text-slate-600">Austin, TX</p>
          </div>
        </div>

        <form className="bg-slate-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Your Name"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Your Email"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
            />
          </div>
          <input
            type="text"
            placeholder="Subject"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent mb-4"
          />
          <textarea
            placeholder="Your Message"
            rows={5}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent mb-6"
          />
          <button
            type="submit"
            className="w-full bg-[#22C55E] text-white py-3 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  )
}
