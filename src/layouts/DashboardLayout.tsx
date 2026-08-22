import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, MapPin, CreditCard, Settings, LogOut, Menu, X, Plus, Scissors } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null)

  // Fetch the customer's name + avatar to show in the sidebar instead of
  // a generic icon. The auth context also fetches this — but DashboardLayout
  // needs the avatar immediately on mount for a snappy first render.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase
      .from('customer_profiles')
      .select('first_name, last_name, profile_image_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        if (data) {
          const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || null
          setProfileName(name)
          setProfileAvatar((data as any).profile_image_url ?? null)
        }
      })
    return () => { cancelled = true }
  }, [user])

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
      <div className="p-6 border-b border-[#047857]">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="w-8 h-8 bg-[#22C55E] rounded-lg flex items-center justify-center flex-shrink-0">
            <Scissors className="text-white" size={16} />
          </span>
          <span className="text-white">MowList</span>
        </Link>
        {(profileName || profileAvatar) && (
          <div className="flex items-center gap-2 mt-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profileAvatar ? (
                <img
                  src={profileAvatar}
                  alt={profileName || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {(profileName || '?').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {profileName && (
              <p className="text-sm text-white font-medium truncate">{profileName}</p>
            )}
          </div>
        )}
      </div>
      {/* Book Service button - always visible, prominent */}
      <div className="p-4 border-b border-[#047857]">
        <Link
          to="/book"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center justify-center gap-2 w-full bg-white text-[#047857] px-4 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors shadow-sm"
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
      <div className="p-4 border-t border-[#047857]">
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
      {/* Mobile menu button - fixed top right */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-40 bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
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
            className="w-64 bg-[#059669] text-white h-full relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar - always visible */}
      <aside className="w-64 bg-[#059669] text-white hidden md:block fixed h-full flex flex-col">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
