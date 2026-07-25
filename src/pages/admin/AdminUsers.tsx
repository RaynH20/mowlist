import { useState } from 'react'
import { Users, Search, Mail, Calendar, MoreVertical } from 'lucide-react'

export default function AdminUsers() {
  const [search, setSearch] = useState('')

  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', phone: '(512) 555-0101', joined: 'Jan 2026', bookings: 5, status: 'active' },
    { id: 2, name: 'Sarah Smith', email: 'sarah@example.com', phone: '(512) 555-0102', joined: 'Feb 2026', bookings: 3, status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', phone: '(512) 555-0103', joined: 'Feb 2026', bookings: 8, status: 'active' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', phone: '(512) 555-0104', joined: 'Mar 2026', bookings: 2, status: 'inactive' },
    { id: 5, name: 'Chris Wilson', email: 'chris@example.com', phone: '(512) 555-0105', joined: 'Mar 2026', bookings: 1, status: 'active' },
  ]

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 text-sm">{users.length} registered users</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Users List - Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-[#22C55E] font-semibold">{user.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {user.status}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar size={14} /> {user.joined}
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                {user.bookings} bookings
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Contact</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Joined</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Bookings</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-[#22C55E] font-semibold text-sm">{user.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-slate-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{user.email}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{user.joined}</td>
                <td className="px-5 py-3 text-center text-sm text-slate-900">{user.bookings}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
