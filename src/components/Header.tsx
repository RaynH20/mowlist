import { Link } from 'react-router-dom'
import { Menu, X, LogOut, User, Scissors } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth-context'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  const getDashboardLink = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'provider':
        return '/pro'
      case 'admin':
        return '/admin/users'
      default:
        return '/dashboard'
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <div className="w-8 h-8 bg-[#22C55E] rounded-lg flex items-center justify-center mr-1">
              <Scissors className="text-white" size={16} />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-[#22C55E]">Mow</span>
              <span className="text-[#1E40AF]">List</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/how-it-works" className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium">
              How It Works
            </Link>
            <Link to="/pricing" className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium">
              Pricing
            </Link>
            <Link to="/service-areas" className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium">
              Service Areas
            </Link>
            <Link to="/for-pros" className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium">
              For Pros
            </Link>
            <Link to="/safety" className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium">
              Trust & Safety
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                >
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                    <User size={16} className="text-slate-600" />
                  </div>
                  <span className="text-sm">{user.email}</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors font-medium"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login/customer" className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium">
                  Log In
                </Link>
                <Link
                  to="/book"
                  className="bg-[#22C55E] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
                >
                  Book Now
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/how-it-works"
                className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                to="/pricing"
                className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/service-areas"
                className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Service Areas
              </Link>
              <Link
                to="/for-pros"
                className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                For Pros
              </Link>
              <Link
                to="/safety"
                className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Trust & Safety
              </Link>
              <div className="flex flex-col space-y-3 pt-4 border-t">
                {user ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center gap-2 text-slate-600 hover:text-[#22C55E] transition-colors font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User size={18} />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors font-medium"
                    >
                      <LogOut size={18} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login/customer"
                      className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      to="/book"
                      className="bg-[#22C55E] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Book Now
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
