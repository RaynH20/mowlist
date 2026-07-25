import { useState } from 'react'
import { DollarSign, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, MoreVertical, TrendingUp, Wallet, AlertTriangle, RefreshCw, Building, Shield } from 'lucide-react'

interface Transaction {
  id: string
  type: 'payout' | 'commission' | 'refund' | 'charge'
  recipient?: string
  source?: string
  method: string
  amount: number
  fee: number
  date: string
  status: 'completed' | 'pending' | 'failed'
}

export default function AdminPayments() {
  const [filter, setFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('30')

  const transactions: Transaction[] = [
    { id: 'TXN-001', type: 'charge', source: 'Sarah Johnson', method: 'Credit Card', amount: 45, fee: 1.80, date: 'Mar 10, 2026', status: 'completed' },
    { id: 'TXN-002', type: 'payout', recipient: 'Mike Thompson', method: 'Bank Transfer', amount: 38.25, fee: 0, date: 'Mar 10, 2026', status: 'completed' },
    { id: 'TXN-003', type: 'commission', source: 'Platform Fee', method: '-', amount: 6.75, fee: 0, date: 'Mar 10, 2026', status: 'completed' },
    { id: 'TXN-004', type: 'charge', source: 'Michael Chen', method: 'Credit Card', amount: 55, fee: 2.20, date: 'Mar 9, 2026', status: 'completed' },
    { id: 'TXN-005', type: 'payout', recipient: 'James Wilson', method: 'Bank Transfer', amount: 42, fee: 0, date: 'Mar 9, 2026', status: 'completed' },
    { id: 'TXN-006', type: 'payout', recipient: 'Lisa Anderson', method: 'PayPal', amount: 35, fee: 0, date: 'Mar 9, 2026', status: 'pending' },
    { id: 'TXN-007', type: 'refund', recipient: 'Jennifer Lee', method: 'Credit Card', amount: 40, fee: 0, date: 'Mar 8, 2026', status: 'completed' },
    { id: 'TXN-008', type: 'charge', source: 'David Kim', method: 'Credit Card', amount: 35, fee: 1.40, date: 'Mar 8, 2026', status: 'completed' },
  ]

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  // Calculate stats
  const totalRevenue = transactions.filter(t => t.type === 'charge').reduce((sum, t) => sum + t.amount, 0)
  const platformFees = transactions.filter(t => t.type === 'commission').reduce((sum, t) => sum + t.amount, 0)
  const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0)
  const totalRefunds = transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0)
  const pendingPayouts = transactions.filter(t => t.type === 'payout' && t.status === 'pending').reduce((sum, t) => sum + t.amount, 0)
  const netRevenue = totalRevenue - platformFees - totalRefunds

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'charge':
        return <ArrowDownLeft size={16} className="text-green-500" />
      case 'payout':
        return <ArrowUpRight size={16} className="text-red-500" />
      case 'commission':
        return <Wallet size={16} className="text-blue-500" />
      case 'refund':
        return <RefreshCw size={16} className="text-orange-500" />
      default:
        return <DollarSign size={16} className="text-slate-500" />
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Payments & Revenue</h1>
        <p className="text-slate-500 text-sm">Track revenue, platform fees, and provider payouts</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-end mb-4">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Gross Revenue</span>
          </div>
          <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">Customer payments</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Wallet size={18} />
            <span className="text-sm font-medium">Platform Fees</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">${platformFees.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">15% commission</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <ArrowUpRight size={18} />
            <span className="text-sm font-medium">Provider Payouts</span>
          </div>
          <div className="text-2xl font-bold text-red-600">${totalPayouts.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">Paid to pros</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign size={18} />
            <span className="text-sm font-medium">Net Revenue</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">${netRevenue.toFixed(2)}</div>
          <p className="text-xs text-slate-500 mt-1">After payouts & refunds</p>
        </div>
      </div>

      {/* Payout Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Pending Payouts</p>
              <p className="text-2xl font-bold mt-1">${pendingPayouts.toFixed(2)}</p>
            </div>
            <Clock size={24} className="text-white/50" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Refunds Issued</p>
              <p className="text-2xl font-bold mt-1">${totalRefunds.toFixed(2)}</p>
            </div>
            <RefreshCw size={24} className="text-white/50" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">This Month</p>
              <p className="text-2xl font-bold mt-1">$2,340.50</p>
            </div>
            <TrendingUp size={24} className="text-white/50" />
          </div>
        </div>
      </div>

      {/* Payment Method Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <CreditCard size={20} className="text-slate-600" />
            <div>
              <p className="font-semibold text-slate-900">Credit Cards</p>
              <p className="text-xs text-slate-500">85% of payments</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Shield size={20} className="text-slate-600" />
            <div>
              <p className="font-semibold text-slate-900">Secure</p>
              <p className="text-xs text-slate-500">Powered by Stripe</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Building size={20} className="text-slate-600" />
            <div>
              <p className="font-semibold text-slate-900">Bank Transfers</p>
              <p className="text-xs text-slate-500">For payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-slate-900">PCI Compliant</p>
              <p className="text-xs text-slate-500">100% secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Transactions' },
          { id: 'charge', label: 'Customer Payments' },
          { id: 'payout', label: 'Provider Payouts' },
          { id: 'commission', label: 'Platform Fees' },
          { id: 'refund', label: 'Refunds' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.id
                ? 'bg-[#22C55E] text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#22C55E]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List - Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  transaction.type === 'charge' ? 'bg-green-50' :
                  transaction.type === 'payout' ? 'bg-red-50' :
                  transaction.type === 'refund' ? 'bg-orange-50' :
                  'bg-blue-50'
                }`}>
                  {getTypeIcon(transaction.type)}
                </div>
                <div>
                  <span className="font-medium text-slate-900 capitalize">{transaction.type}</span>
                  <span className="text-xs text-slate-400 ml-2">{transaction.id}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </span>
            </div>
            <div className="text-sm text-slate-600 mb-1">{transaction.recipient || transaction.source}</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{transaction.date}</span>
              <span className={`font-semibold ${
                transaction.type === 'refund' || transaction.type === 'payout' ? 'text-red-600' : 'text-green-600'
              }`}>
                {transaction.type === 'refund' || transaction.type === 'payout' ? '-' : '+'}${transaction.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Transaction</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Details</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Method</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Amount</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 text-sm font-medium text-slate-900">{transaction.id}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-lg ${
                      transaction.type === 'charge' ? 'bg-green-50' :
                      transaction.type === 'payout' ? 'bg-red-50' :
                      transaction.type === 'refund' ? 'bg-orange-50' :
                      'bg-blue-50'
                    }`}>
                      {getTypeIcon(transaction.type)}
                    </div>
                    <span className="text-sm text-slate-900 capitalize">{transaction.type}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{transaction.recipient || transaction.source}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{transaction.method}</td>
                <td className={`px-5 py-3 text-right text-sm font-semibold ${
                  transaction.type === 'refund' || transaction.type === 'payout' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'refund' || transaction.type === 'payout' ? '-' : '+'}${transaction.amount.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-sm text-slate-500">{transaction.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
