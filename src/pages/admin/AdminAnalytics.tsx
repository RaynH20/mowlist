import { useState } from 'react'
import { Users, DollarSign, Calendar, TrendingUp, CheckCircle, Clock, AlertCircle, CreditCard, UserCheck, MapPin } from 'lucide-react'

interface Transaction {
  id: string
  customer: string
  pro: string
  service: string
  amount: number
  platformFee: number
  proPayout: number
  status: 'completed' | 'pending' | 'refunded'
  date: string
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState('30d')

  const stats = [
    {
      label: 'Total Bookings',
      value: '1,847',
      sub: 'All time',
      icon: Calendar,
      change: '+12%',
      color: 'blue'
    },
    {
      label: 'Completed Jobs',
      value: '1,623',
      sub: 'This month',
      icon: CheckCircle,
      change: '+18%',
      color: 'green'
    },
    {
      label: 'Active Pros',
      value: '89',
      sub: 'Online now',
      icon: UserCheck,
      change: '+5%',
      color: 'emerald'
    },
    {
      label: 'Total Revenue',
      value: '$67,430',
      sub: 'Gross volume',
      icon: DollarSign,
      change: '+22%',
      color: 'green'
    },
  ]

  const transactions: Transaction[] = [
    { id: 'TXN-001', customer: 'Sarah Johnson', pro: 'Mike Thompson', service: 'Lawn Mowing', amount: 45, platformFee: 9, proPayout: 36, status: 'completed', date: 'Mar 10, 2026' },
    { id: 'TXN-002', customer: 'Michael Chen', pro: 'James Wilson', service: 'Lawn Mowing + Edging', amount: 60, platformFee: 12, proPayout: 48, status: 'completed', date: 'Mar 10, 2026' },
    { id: 'TXN-003', customer: 'Emily Rodriguez', pro: 'Mike Thompson', service: 'Lawn Mowing', amount: 45, platformFee: 9, proPayout: 36, status: 'pending', date: 'Mar 9, 2026' },
    { id: 'TXN-004', customer: 'David Kim', pro: 'Lisa Anderson', service: 'Leaf Removal', amount: 75, platformFee: 15, proPayout: 60, status: 'completed', date: 'Mar 9, 2026' },
    { id: 'TXN-005', customer: 'Jennifer Lee', pro: 'James Wilson', service: 'Lawn Mowing', amount: 40, platformFee: 8, proPayout: 32, status: 'refunded', date: 'Mar 8, 2026' },
    { id: 'TXN-006', customer: 'Robert Taylor', pro: 'Mike Thompson', service: 'Lawn Mowing + Edging', amount: 55, platformFee: 11, proPayout: 44, status: 'completed', date: 'Mar 8, 2026' },
    { id: 'TXN-007', customer: 'Amanda White', pro: 'Lisa Anderson', service: 'Lawn Mowing', amount: 45, platformFee: 9, proPayout: 36, status: 'completed', date: 'Mar 7, 2026' },
    { id: 'TXN-008', customer: 'Chris Brown', pro: 'James Wilson', service: 'Hedge Trimming', amount: 80, platformFee: 16, proPayout: 64, status: 'completed', date: 'Mar 7, 2026' },
  ]

  const healthMetrics = [
    { label: 'Avg. Completion Rate', value: '94.2%', status: 'good' },
    { label: 'On-Time Rate', value: '91.8%', status: 'good' },
    { label: 'Customer Satisfaction', value: '4.8/5', status: 'good' },
    { label: 'Dispute Rate', value: '0.8%', status: 'warning' },
    { label: 'Pro Retention', value: '87.3%', status: 'good' },
    { label: 'Payment Success', value: '99.4%', status: 'good' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'refunded':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-slate-600'
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Platform overview and metrics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-[#22C55E] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${
                stat.color === 'blue' ? 'bg-blue-50' :
                stat.color === 'green' ? 'bg-green-50' :
                stat.color === 'emerald' ? 'bg-emerald-50' :
                'bg-slate-100'
              }`}>
                <stat.icon
                  className={
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'emerald' ? 'text-emerald-600' :
                    'text-slate-600'
                  }
                  size={20}
                />
              </div>
              <span className="text-green-500 text-xs font-medium">{stat.change}</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
            <div className="text-slate-400 text-xs">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Platform Health */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Platform Health</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {healthMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className={`text-xl md:text-2xl font-bold ${getHealthStatus(metric.status)}`}>
                {metric.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
            <button className="text-[#22C55E] text-sm font-medium hover:underline">
              View All
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {transactions.slice(0, 5).map((txn) => (
            <div key={txn.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900">{txn.id}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                  {txn.status}
                </span>
              </div>
              <div className="text-sm text-slate-600 mb-1">{txn.customer}</div>
              <div className="text-xs text-slate-500 mb-2">{txn.service}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{txn.date}</span>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">${txn.amount}</div>
                  <div className="text-xs text-slate-500">Fee: ${txn.platformFee}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Transaction</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Pro</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Service</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Amount</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Fee</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Payout</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{txn.id}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{txn.customer}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{txn.pro}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{txn.service}</td>
                  <td className="px-5 py-3 text-sm text-slate-900 text-right font-medium">${txn.amount}</td>
                  <td className="px-5 py-3 text-sm text-slate-500 text-right">${txn.platformFee}</td>
                  <td className="px-5 py-3 text-sm text-green-600 text-right font-medium">${txn.proPayout}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-500 text-right">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Revenue This Month</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Gross Volume</span>
                <span className="font-medium text-slate-900">$12,450</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#22C55E] rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Platform Fees</span>
                <span className="font-medium text-slate-900">$2,490</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Pro Payouts</span>
                <span className="font-medium text-slate-900">$9,960</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-900 mb-4">Top Services</h3>
          <div className="space-y-3">
            {[
              { name: 'Lawn Mowing', count: 845, pct: 58 },
              { name: 'Lawn Mowing + Edging', count: 312, pct: 21 },
              { name: 'Leaf Removal', count: 156, pct: 11 },
              { name: 'Hedge Trimming', count: 98, pct: 7 },
              { name: 'Other', count: 56, pct: 3 },
            ].map((service, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{service.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{service.count}</span>
                  <span className="text-xs text-slate-400">({service.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
