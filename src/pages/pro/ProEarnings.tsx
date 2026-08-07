import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, Calendar, Clock, Loader2, CheckCircle2,
  AlertCircle, Wallet, ArrowUpRight, MapPin, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getProEarningsBreakdown, type ProBookingWithDetails } from '../../lib/proDashboard'
import { serviceTypeLabel, yardSizeLabel } from '../../lib/labels'
import JobPhotoGallery from '../../components/JobPhotoGallery'

export default function ProEarnings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    allTime: 0,
    pendingPayout: 0,
    paidOut: 0,
    completedJobs: [] as ProBookingWithDetails[],
  })

  useEffect(() => {
    if (user) fetchEarnings()
  }, [user])

  const fetchEarnings = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await getProEarningsBreakdown(user.id)
      if (error) console.error('Earnings error:', error)
      setEarnings(data)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#22C55E] mx-auto mb-3" />
          <p className="text-slate-500">Loading earnings…</p>
        </div>
      </div>
    )
  }

  const noEarningsYet = earnings.allTime === 0 && earnings.completedJobs.length === 0

  return (
    <div className="p-4 md:p-6">
      {/* Hero stat */}
      <div className="bg-gradient-to-br from-[#22C55E] to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-green-100 text-sm font-medium">All-time earnings</p>
            <p className="text-5xl font-bold mt-1">${earnings.allTime.toFixed(2)}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <Wallet size={28} />
          </div>
        </div>
        <p className="text-green-100 text-sm mt-2">
          {earnings.completedJobs.length} completed job{earnings.completedJobs.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Time-window stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Today"
          amount={earnings.today}
          icon={<Clock size={18} className="text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          label="This week"
          amount={earnings.thisWeek}
          icon={<Calendar size={18} className="text-purple-600" />}
          iconBg="bg-purple-50"
        />
        <StatCard
          label="This month"
          amount={earnings.thisMonth}
          icon={<TrendingUp size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
      </div>

      {/* Payout status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Pending payout</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">${earnings.pendingPayout.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Sent to your bank on schedule</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>
            <span className="text-sm text-slate-500">Already paid out</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">${earnings.paidOut.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">From your payout history</p>
        </div>
      </div>

      {/* Stripe onboarding CTA (only show if no completed earnings yet, suggesting no Stripe Connect) */}
      {noEarningsYet && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Get ready for payouts</h3>
              <p className="text-sm text-slate-600 mb-3">
                Once you complete a job, your earnings will appear here. To get paid,
                connect your bank account in your profile.
              </p>
              <a
                href="/pro/profile"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Set up payouts
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Completed jobs table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Completed jobs</h2>
          <p className="text-xs text-slate-500 mt-1">
            {earnings.completedJobs.length} total
          </p>
        </div>

        {earnings.completedJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <DollarSign size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-700">No completed jobs yet</p>
            <p className="text-sm mt-1">Complete your first job to start earning.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {earnings.completedJobs.map((job) => (
              <div key={job.id}>
                <button
                  onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-slate-900 truncate">
                        {job.customer_name || 'Customer'}
                      </p>
                      <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                        {yardSizeLabel(job.yard_size_category)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />
                      {job.address_city || '—'}, {job.address_state || ''}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(job.completed_at || job.scheduled_date)}
                      {' · '}
                      <span>{serviceTypeLabel(job.service_type)}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <p className="text-base font-bold text-[#22C55E]">
                        +${(job.provider_payout_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">earned</p>
                    </div>
                    {expandedJob === job.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </button>
                {expandedJob === job.id && (
                  <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-sm pt-3">
                      <div>
                        <p className="text-xs text-slate-500">Service</p>
                        <p className="font-medium text-slate-900">{serviceTypeLabel(job.service_type)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Yard size</p>
                        <p className="font-medium text-slate-900">{yardSizeLabel(job.yard_size_category)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Your payout</p>
                        <p className="font-medium text-[#22C55E]">${(job.provider_payout_amount || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Photos you uploaded</p>
                      <JobPhotoGallery bookingId={job.id} allowUpload={false} compact />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout schedule note */}
      <div className="mt-6 text-center text-xs text-slate-400">
        <p>
          Payouts are processed weekly. Connect your bank account in your profile to receive payments.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  label, amount, icon, iconBg,
}: {
  label: string
  amount: number
  icon: React.ReactNode
  iconBg: string
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">${amount.toFixed(2)}</p>
    </div>
  )
}
