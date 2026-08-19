import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User, Scissors } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!loginDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLoginDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [loginDropdownOpen])

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
    navigate('/', { replace: true })
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
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-slate-600 hover:text-[#22C55E] transition-colors p-1"
                  title={user.email || 'Dashboard'}
                  aria-label="Go to dashboard"
                >
                  <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
                    <User size={18} className="text-slate-600" />
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center text-slate-600 hover:text-red-500 transition-colors p-1"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    aria-haspopup="true"
                    aria-expanded={loginDropdownOpen}
                    className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium flex items-center gap-1 px-2 py-1"
                  >
                    Log In
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${loginDropdownOpen ? 'rotate-180' : ''}`}>
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {loginDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-2 z-50"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Link
                        to="/login/customer"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="block px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="font-medium text-slate-900 text-sm">I'm a customer</div>
                        <div className="text-xs text-slate-500">Book lawn care for my home</div>
                      </Link>
                      <div className="border-t border-slate-100 my-1" />
                      <Link
                        to="/login/pro"
                        onClick={() => setLoginDropdownOpen(false)}
                        className="block px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="font-medium text-slate-900 text-sm">I'm a lawn pro</div>
                        <div className="text-xs text-slate-500">Sign in to my pro dashboard</div>
                      </Link>
                    </div>
                  )}
                </div>
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
                    <div className="flex flex-col space-y-1">
                      <Link
                        to="/login/customer"
                        className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium text-center py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Log In (Customer)
                      </Link>
                      <Link
                        to="/login/pro"
                        className="text-slate-600 hover:text-[#22C55E] transition-colors font-medium text-center py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Log In (Lawn Pro)
                      </Link>
                    </div>
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
