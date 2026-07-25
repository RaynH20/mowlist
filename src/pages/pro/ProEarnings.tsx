import { useState } from 'react'
import { DollarSign, TrendingUp, Calendar, CheckCircle, Clock, ArrowUpRight, Wallet, Building, AlertCircle, Check, ExternalLink, CreditCard, Shield } from 'lucide-react'

interface CompletedJob {
  id: number
  customer: string
  address: string
  date: string
  payout: number
  status: 'pending' | 'paid' | 'processing'
  rating?: number
}

interface PayoutRecord {
  id: number
  date: string
  amount: number
  status: 'completed' | 'pending' | 'failed'
  method: string
}

export default function ProEarnings() {
  const [payoutMethod] = useState('bank')

  // Earnings data
  const completedJobs: CompletedJob[] = [
    { id: 1, customer: 'Sarah Johnson', address: '123 Main St, Austin', date: 'Mar 8, 2026', payout: 35, status: 'pending' },
    { id: 2, customer: 'Michael Chen', address: '456 Oak Ave, Austin', date: 'Mar 7, 2026', payout: 45, status: 'pending' },
    { id: 3, customer: 'Emily Rodriguez', address: '789 Pine Rd, Austin', date: 'Mar 6, 2026', payout: 30, status: 'paid' },
    { id: 4, customer: 'David Kim', address: '321 Maple Dr, Austin', date: 'Mar 5, 2026', payout: 55, status: 'paid' },
    { id: 5, customer: 'Jennifer Lee', address: '654 Cedar Ln, Austin', date: 'Mar 4, 2026', payout: 35, status: 'paid' },
    { id: 6, customer: 'Robert Taylor', address: '987 Birch Way, Austin', date: 'Mar 3, 2026', payout: 40, status: 'paid' },
  ]

  const payoutHistory: PayoutRecord[] = [
    { id: 1, date: 'March 1, 2026', amount: 340, status: 'completed', method: 'Bank Transfer' },
    { id: 2, date: 'February 22, 2026', amount: 425, status: 'completed', method: 'Bank Transfer' },
    { id: 3, date: 'February 15, 2026', amount: 380, status: 'completed', method: 'Bank Transfer' },
    { id: 4, date: 'February 8, 2026', amount: 290, status: 'completed', method: 'Bank Transfer' },
  ]

  // Calculate earnings
  const pendingJobs = completedJobs.filter(j => j.status === 'pending')
  const pendingAmount = pendingJobs.reduce((sum, job) => sum + job.payout, 0)
  const todayEarnings = completedJobs.slice(0, 1).reduce((sum, job) => sum + job.payout, 0)
  const weekEarnings = completedJobs.slice(0, 3).reduce((sum, job) => sum + job.payout, 0)
  const monthEarnings = completedJobs.reduce((sum, job) => sum + job.payout, 0)
  const totalPaid = payoutHistory.reduce((sum, p) => sum + p.amount, 0)

  // Stripe Connect status
  const stripeConnected = true
  const accountStatus = 'active'

  const platformFee = 0.15 // 15% platform fee

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Earnings & Payouts</h1>
        <p className="text-slate-500 text-sm">Track your income and manage payouts</p>
      </div>

      {/* Stripe Connect Status Banner */}
      {stripeConnected ? (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="font-semibold">Stripe Connect Active</p>
                <p className="text-xs text-white/80">Payouts powered by Stripe</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full">
              <Check size={14} />
              <span className="text-sm font-medium">{accountStatus}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <div>
                <p className="font-semibold">Complete Payout Setup</p>
                <p className="text-xs text-white/80">Connect your bank account to receive payments</p>
              </div>
            </div>
            <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-50 transition-colors">
              Set Up Payouts
            </button>
          </div>
        </div>
      )}

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Wallet size={18} />
            <span className="text-sm font-medium">Available Balance</span>
          </div>
          <div className="text-2xl font-bold text-[#22C55E]">$0.00</div>
          <p className="text-xs text-slate-500 mt-1">Ready to withdraw</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock size={18} />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">${pendingAmount}</div>
          <p className="text-xs text-slate-500 mt-1">{pendingJobs.length} jobs awaiting payout</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">${weekEarnings}</div>
          <p className="text-xs text-slate-500 mt-1">+15% from last week</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar size={18} />
            <span className="text-sm font-medium">Total Paid Out</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">${totalPaid}</div>
          <p className="text-xs text-slate-500 mt-1">All time earnings</p>
        </div>
      </div>

      {/* Pending Payment Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Pending Payment</p>
            <p className="text-3xl font-bold mt-1">${pendingAmount}</p>
            <p className="text-blue-100 text-xs mt-1">From {pendingJobs.length} completed jobs</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">Next payout scheduled</p>
              <p className="font-semibold">Friday, March 13, 2026</p>
            </div>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
              Request Early Payout
            </button>
          </div>
        </div>
      </div>

      {/* Payout Method */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Payout Method</h2>
          <button className="text-[#22C55E] text-sm font-medium flex items-center gap-1">
            Manage <ExternalLink size={14} />
          </button>
        </div>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <Building size={24} className="text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Chase Bank ****4567</p>
            <p className="text-sm text-slate-500">Primary account • Business checking</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-600" />
            <span className="text-sm text-green-600 font-medium">Verified</span>
          </div>
        </div>
      </div>

      {/* Fee Explanation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Earnings Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Customer pays (example)</span>
            <span className="font-medium">$50.00</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Platform fee (15%)</span>
            <span className="text-red-500">-$7.50</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Processing fee (2.9% + $0.30)</span>
            <span className="text-red-500">-$1.75</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="font-semibold text-slate-900">Your payout</span>
            <span className="font-bold text-[#22C55E]">$40.75</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          * Actual amounts vary by job. Payments are held until service is confirmed complete.
        </p>
      </div>

      {/* Pending Jobs */}
      {pendingJobs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Pending Payouts</h2>
            <p className="text-slate-500 text-sm">Jobs completed, awaiting payout</p>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingJobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Clock size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.customer}</h3>
                    <p className="text-sm text-slate-500">{job.address} • {job.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">+${job.payout}</p>
                  <span className="text-xs text-amber-600">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">This Month's Jobs</h2>
          <p className="text-slate-500 text-sm">Your recent work history</p>
        </div>
        <div className="divide-y divide-slate-100">
          {completedJobs.map((job) => (
            <div key={job.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    job.status === 'paid' ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {job.status === 'paid' ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <Clock size={20} className="text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.customer}</h3>
                    <p className="text-sm text-slate-500">{job.address}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{job.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${job.status === 'paid' ? 'text-[#22C55E]' : 'text-amber-600'}`}>
                    +${job.payout}
                  </p>
                  <span className={`text-xs font-medium ${
                    job.status === 'paid' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {job.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Payout History</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {payoutHistory.map((payout) => (
            <div key={payout.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{payout.date}</p>
                <p className="text-sm text-slate-500">{payout.method}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">${payout.amount.toFixed(2)}</p>
                <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                  <ArrowUpRight size={12} /> {payout.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
