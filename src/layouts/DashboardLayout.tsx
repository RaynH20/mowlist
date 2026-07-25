import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, Calendar, MapPin, CreditCard, Settings, LogOut } from 'lucide-react'

export default function DashboardLayout() {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/dashboard/services', label: 'My Services', icon: Calendar },
    { path: '/dashboard/track', label: 'Track Service', icon: MapPin },
    { path: '/dashboard/payment', label: 'Payment', icon: CreditCard },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="pt-16 min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r hidden md:block fixed h-full">
        <div className="p-6">
          <Link to="/" className="text-xl font-bold">
            <span className="text-[#22C55E]">Mow</span>
            <span className="text-[#1E40AF]">List</span>
          </Link>
        </div>
        <nav className="px-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                location.pathname === item.path
                  ? 'bg-green-50 text-[#22C55E] font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6">
        <Outlet />
      </main>
    </div>
  )
}
