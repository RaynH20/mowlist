import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, MapPin, CreditCard, Settings, LogOut, Menu, X, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import Header from '../components/Header'

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMobileMenuOpen(false)
    navigate('/', { replace: true })
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/dashboard/services', label: 'My Services', icon: Calendar },
    { path: '/dashboard/track', label: 'Track Service', icon: MapPin },
    { path: '/dashboard/payment', label: 'Payment', icon: CreditCard },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-[#16A34A]">
        <Link to="/" className="text-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="text-white">Mow</span>
          <span className="text-[#86EFAC]">List</span>
        </Link>
        {user?.email && (
          <p className="text-xs text-green-100 mt-1 truncate opacity-80">{user.email}</p>
        )}
      </div>
      {/* Book Service button - always visible, prominent */}
      <div className="p-4 border-b border-[#16A34A]">
        <Link
          to="/book"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center justify-center gap-2 w-full bg-white text-[#16A34A] px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Book a Service
        </Link>
      </div>
      <nav className="px-4 py-4 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              location.pathname === item.path
                ? 'bg-white/15 text-white font-medium'
                : 'text-green-50 hover:bg-white/10'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-[#16A34A]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-green-50 hover:bg-white/10 rounded-lg transition-colors text-left"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      {/* Mobile menu button - fixed top right below header */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-20 right-4 z-40 bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile sidebar - slides in as overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside
            className="w-64 bg-[#22C55E] text-white h-full relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar - always visible */}
      <aside className="w-64 bg-[#22C55E] text-white hidden md:block fixed h-full flex flex-col">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
