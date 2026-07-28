import { Link, Outlet, useLocation } from 'react-router-dom'
import { Briefcase, Calendar, DollarSign, MapPin, User, LogOut, Home, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function ProLayout() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/pro', label: 'Available Jobs', icon: Briefcase },
    { path: '/pro/schedule', label: 'My Jobs', icon: Calendar },
    { path: '/pro/earnings', label: 'Earnings', icon: DollarSign },
    { path: '/pro/profile', label: 'Profile', icon: User },
    { path: '/pro/area', label: 'Service Area', icon: MapPin },
  ]

  const isJobsPage = location.pathname === '/pro'

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-blue-800">
        <Link to="/" className="text-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="text-[#22C55E]">MowList</span>
          <span className="text-white"> Pro</span>
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
                ? 'bg-white/10 text-white font-medium'
                : 'text-blue-200 hover:bg-white/5'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-800">
        <Link
          to="/login"
          onClick={() => setIsMobileMenuOpen(false)}
          className="flex items-center gap-3 px-4 py-3 text-blue-200 hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Log Out
        </Link>
      </div>
    </>
  )

  return (
    <div className="pt-16 min-h-screen bg-slate-50">
      {/* Mobile menu button - fixed top right below header */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-20 right-4 z-40 bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside
            className="w-64 bg-[#1E40AF] text-white h-full relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar - always visible */}
      <aside className="hidden md:flex w-64 bg-[#1E40AF] text-white fixed h-full flex-col">
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation - quick access to main pages */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex justify-around items-center py-2">
          <Link
            to="/pro"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isJobsPage ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <Briefcase size={22} />
            <span className="text-xs font-medium">Jobs</span>
          </Link>
          <Link
            to="/pro/schedule"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/pro/schedule' ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <Calendar size={22} />
            <span className="text-xs font-medium">Schedule</span>
          </Link>
          <Link
            to="/pro/earnings"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              location.pathname === '/pro/earnings' ? 'text-[#22C55E]' : 'text-slate-500'
            }`}
          >
            <DollarSign size={22} />
            <span className="text-xs font-medium">Earnings</span>
          </Link>
          <Link
            to="/pro/profile"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
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
