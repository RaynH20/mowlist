import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Users, UserCheck, Calendar, DollarSign, AlertTriangle, BarChart3, LogOut, Home } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import Header from '../components/Header'

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const navItems = [
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/pros', label: 'Pros', icon: UserCheck },
    { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { path: '/admin/payments', label: 'Pay', icon: DollarSign },
    { path: '/admin/analytics', label: 'Stats', icon: BarChart3 },
  ]

  // Check if current path matches for mobile nav
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white fixed h-full flex-col">
        <div className="p-6">
          <Link to="/" className="text-xl font-bold">
            <span className="text-[#22C55E]">MowList</span>
            <span className="text-white"> Admin</span>
          </Link>
        </div>
        <nav className="px-4 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                location.pathname === item.path
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          <Link
            to="/admin/disputes"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              location.pathname === '/admin/disputes'
                ? 'bg-slate-800 text-white font-medium'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle size={20} />
            Disputes
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors text-left"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex justify-around items-center py-2">
          <Link
            to="/admin/users"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/users') ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <Users size={20} />
            <span className="text-xs font-medium">Users</span>
          </Link>
          <Link
            to="/admin/pros"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/pros') ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <UserCheck size={20} />
            <span className="text-xs font-medium">Pros</span>
          </Link>
          <Link
            to="/admin/bookings"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/bookings') ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <Calendar size={20} />
            <span className="text-xs font-medium">Bookings</span>
          </Link>
          <Link
            to="/admin/payments"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/payments') ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <DollarSign size={20} />
            <span className="text-xs font-medium">Pay</span>
          </Link>
          <Link
            to="/admin/analytics"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActive('/admin/analytics') ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <BarChart3 size={20} />
            <span className="text-xs font-medium">Stats</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
