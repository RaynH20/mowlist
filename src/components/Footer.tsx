import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#1E40AF] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="text-2xl font-bold">
              <span className="text-[#22C55E]">Mow</span>
              <span className="text-white">List</span>
            </Link>
            <p className="mt-4 text-blue-200">
              Find a trusted local lawn pro in minutes. Book recurring lawn service without the hassle.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/book" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  One-Time Mowing
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Weekly Service
                </Link>
              </li>
              <li>
                <Link to="/book" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Bi-Weekly Service
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/how-it-works" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/for-pros" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Become a Pro
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/service-areas" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Service Areas
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/faq" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link to="/cancellation" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/refund" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/weather" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Weather Policy
                </Link>
              </li>
              <li>
                <Link to="/dispute" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Dispute Resolution
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-blue-200 hover:text-[#22C55E] transition-colors">
                  Trust & Safety
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
          <p>&copy; {new Date().getFullYear()} MowList. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
