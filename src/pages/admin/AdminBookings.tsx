import { useState } from 'react'
import { Calendar, Search, MapPin, Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react'

export default function AdminBookings() {
  const [filter, setFilter] = useState('all')

  const bookings = [
    { id: 'BK-001', customer: 'Sarah Johnson', address: '123 Main St, Austin', pro: 'Mike Thompson', service: 'Lawn Mowing', date: 'Mar 10, 2026', time: '10:00 AM', status: 'completed', price: 45 },
    { id: 'BK-002', customer: 'Michael Chen', address: '456 Oak Ave, Austin', pro: 'James Wilson', service: 'Lawn Mowing + Edging', date: 'Mar 10, 2026', time: '2:00 PM', status: 'scheduled', price: 60 },
    { id: 'BK-003', customer: 'Emily Rodriguez', address: '789 Pine Rd, Austin', pro: 'Lisa Anderson', service: 'Lawn Mowing', date: 'Mar 11, 2026', time: '9:00 AM', status: 'scheduled', price: 45 },
    { id: 'BK-004', customer: 'David Kim', address: '321 Maple Dr, Austin', pro: 'Mike Thompson', service: 'Leaf Removal', date: 'Mar 9, 2026', time: '11:00 AM', status: 'completed', price: 75 },
    { id: 'BK-005', customer: 'Jennifer Lee', address: '654 Cedar Ln, Austin', pro: 'James Wilson', service: 'Lawn Mowing', date: 'Mar 8, 2026', time: '3:00 PM', status: 'cancelled', price: 40 },
    { id: 'BK-006', customer: 'Robert Taylor', address: '987 Elm St, Austin', pro: 'Lisa Anderson', service: 'Hedge Trimming', date: 'Mar 12, 2026', time: '10:00 AM', status: 'scheduled', price: 80 },
  ]

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-slate-500 text-sm">{bookings.length} total bookings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'scheduled', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-[#22C55E] text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#22C55E]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List - Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="font-medium text-slate-900">{booking.id}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1">{booking.customer}</h3>
            <p className="text-sm text-slate-500 mb-2">{booking.service}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1"><Calendar size={12} /> {booking.date}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {booking.time}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">{booking.pro}</span>
              <span className="font-semibold text-[#22C55E]">${booking.price}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Booking</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Customer</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Service</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Pro</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-sm font-medium text-slate-900">{booking.id}</td>
                <td className="px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{booking.customer}</div>
                    <div className="text-xs text-slate-500">{booking.address}</div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{booking.service}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{booking.pro}</td>
                <td className="px-5 py-3 text-sm text-slate-600">
                  <div>{booking.date}</div>
                  <div className="text-xs text-slate-400">{booking.time}</div>
                </td>
                <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">${booking.price}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
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
