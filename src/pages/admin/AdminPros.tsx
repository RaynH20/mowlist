import { useState } from 'react'
import { UserCheck, Search, Star, MapPin, Shield, MoreVertical } from 'lucide-react'

export default function AdminPros() {
  const [search, setSearch] = useState('')

  const pros = [
    { id: 1, name: 'Mike Thompson', business: 'Green Lawn Pros', verified: true, jobs: 45, rating: 4.9, earnings: '$3,240', location: 'Austin, TX', status: 'active' },
    { id: 2, name: 'James Wilson', business: "Mike's Mowing", verified: true, jobs: 32, rating: 4.8, earnings: '$2,180', location: 'Austin, TX', status: 'active' },
    { id: 3, name: 'Lisa Anderson', business: 'Quick Cut Services', verified: true, jobs: 28, rating: 4.7, earnings: '$1,890', location: 'Round Rock', status: 'active' },
    { id: 4, name: 'David Garcia', business: 'DG Landscaping', verified: false, jobs: 12, rating: 4.5, earnings: '$840', location: 'Cedar Park', status: 'pending' },
    { id: 5, name: 'Amanda Lee', business: 'Perfect Lawns', verified: true, jobs: 67, rating: 4.9, earnings: '$4,520', location: 'Austin, TX', status: 'active' },
  ]

  const filteredPros = pros.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.business.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Lawn Pros</h1>
        <p className="text-slate-500 text-sm">{pros.length} registered professionals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-2xl font-bold text-slate-900">{pros.filter(p => p.verified).length}</div>
          <div className="text-xs text-slate-500">Verified</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-2xl font-bold text-slate-900">{pros.reduce((a, p) => a + p.jobs, 0)}</div>
          <div className="text-xs text-slate-500">Total Jobs</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="text-2xl font-bold text-slate-900">{(pros.reduce((a, p) => a + p.rating, 0) / pros.length).toFixed(1)}</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search pros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
          />
        </div>
      </div>

      {/* Pros List - Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredPros.map((pro) => (
          <div key={pro.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-[#22C55E] font-bold text-lg">{pro.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{pro.name}</h3>
                  <p className="text-sm text-slate-500">{pro.business}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pro.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {pro.verified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500 fill-yellow-500" /> {pro.rating}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {pro.location}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-500">{pro.jobs} jobs</span>
              <span className="font-semibold text-[#22C55E]">{pro.earnings}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Pro</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Business</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Jobs</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Rating</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Earnings</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPros.map((pro) => (
              <tr key={pro.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-[#22C55E] font-semibold text-sm">{pro.name.charAt(0)}</span>
                    </div>
                    <span className="font-medium text-slate-900">{pro.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{pro.business}</td>
                <td className="px-5 py-3 text-center text-sm text-slate-900">{pro.jobs}</td>
                <td className="px-5 py-3 text-center">
                  <span className="flex items-center justify-center gap-1 text-sm text-slate-900">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" /> {pro.rating}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-sm font-medium text-slate-900">{pro.earnings}</td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pro.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {pro.verified ? 'Verified' : 'Pending'}
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
