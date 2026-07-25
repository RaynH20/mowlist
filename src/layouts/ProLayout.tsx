import { Link, Outlet, useLocation } from 'react-router-dom'
import { Briefcase, Calendar, DollarSign, MapPin, User, LogOut, Home } from 'lucide-react'

export default function ProLayout() {
  const location = useLocation()

  const navItems = [
    { path: '/pro', label: 'Available Jobs', icon: Briefcase },
    { path: '/pro/schedule', label: 'My Jobs', icon: Calendar },
    { path: '/pro/earnings', label: 'Earnings', icon: DollarSign },
    { path: '/pro/profile', label: 'Profile', icon: User },
  ]

  // Check if current path is the root /pro
  const isJobsPage = location.pathname === '/pro'

  return (
    <div className="pt-16 min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#1E40AF] text-white fixed h-full flex-col">
        <div className="p-6">
          <Link to="/" className="text-xl font-bold">
            <span className="text-[#22C55E]">MowList</span>
            <span className="text-white"> Pro</span>
          </Link>
        </div>
        <nav className="px-4 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                location.pathname === item.path
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-blue-200 hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          <Link
            to="/pro/area"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              location.pathname === '/pro/area'
                ? 'bg-white/10 text-white font-medium'
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <MapPin size={20} />
            Service Area
          </Link>
        </nav>
        <div className="p-4 border-t border-blue-800">
          <Link
            to="/login"
            className="flex items-center gap-3 px-4 py-3 text-blue-200 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Log Out
          </Link>
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
            to="/pro"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              isJobsPage ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <Briefcase size={22} />
            <span className="text-xs font-medium">Jobs</span>
          </Link>
          <Link
            to="/pro/schedule"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/pro/schedule' ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <Calendar size={22} />
            <span className="text-xs font-medium">Schedule</span>
          </Link>
          <Link
            to="/pro/earnings"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/pro/earnings' ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <DollarSign size={22} />
            <span className="text-xs font-medium">Earnings</span>
          </Link>
          <Link
            to="/pro/profile"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              location.pathname === '/pro/profile' ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <User size={22} />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
