import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Calendar, DollarSign, Clock, MapPin, ArrowRight,
  AlertCircle, CheckCircle, User, Loader2, Wallet, TrendingUp, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getProviderProfile } from '../../lib/api'
import {
  getAvailableJobsWithDetails,
  getProAssignedJobsWithDetails,
  getProEarningsBreakdown,
  type ProBookingWithDetails,
} from '../../lib/proDashboard'
import AddonBadges from '../../components/AddonBadges'
import { formatBookingStatus, serviceTypeLabel, yardSizeLabel, serviceFrequencyLabel } from '../../lib/labels'

export default function ProDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [availableJobs, setAvailableJobs] = useState<ProBookingWithDetails[]>([])
  const [assignedJobs, setAssignedJobs] = useState<ProBookingWithDetails[]>([])
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [earnings, setEarnings] = useState<{
    today: number
    thisWeek: number
    thisMonth: number
    pendingPayout: number
  }>({ today: 0, thisWeek: 0, thisMonth: 0, pendingPayout: 0 })

  useEffect(() => {
    if (user) loadAll()
  }, [user])

  const loadAll = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [profileRes, availRes, assignedRes, earningsRes] = await Promise.all([
        getProviderProfile(user.id),
        getAvailableJobsWithDetails(),
        getProAssignedJobsWithDetails(user.id),
        getProEarningsBreakdown(user.id),
      ])
      setProfile(profileRes.data || null)
      setAvailableJobs(availRes.data || [])
      setAssignedJobs(assignedRes.data || [])
      if (earningsRes.data) {
        setEarnings({
          today: earningsRes.data.today,
          thisWeek: earningsRes.data.thisWeek,
          thisMonth: earningsRes.data.thisMonth,
          pendingPayout: earningsRes.data.pendingPayout,
        })
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    )
  }

  const displayName =
    profile?.display_name ||
    user?.email?.split('@')[0] ||
    'there'

  const stripeReady =
    !!(profile?.stripe_connect_charges_enabled && profile?.stripe_connect_payouts_enabled)

  // Jobs scheduled for today
  const todayStr = new Date().toISOString().split('T')[0]
  const todaysJobs = assignedJobs.filter((j) => j.scheduled_date === todayStr)
  const upcomingJobs = assignedJobs
    .filter((j) => j.scheduled_date && j.scheduled_date >= todayStr)
    .filter((j) => j.booking_status !== 'completed' && j.booking_status !== 'cancelled')
    .slice(0, 3)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Hey, {displayName} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's how your work is going.</p>
      </div>

      {/* Stripe Connect banner — only when not ready */}
      {!stripeReady && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Wallet className="text-white" size={20} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Set up payouts to start earning</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Connect your bank account in your profile so MowList can send you money.
            </p>
            <Link
              to="/pro/profile"
              className="inline-flex items-center gap-1 text-sm text-amber-700 font-medium mt-2 hover:text-amber-900"
            >
              Set up payouts
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase className="text-blue-600" size={20} />
            </div>
            <span className="text-sm text-slate-500">Available</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{availableJobs.length}</div>
          <div className="text-xs text-slate-400">Jobs in your area</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar className="text-green-600" size={20} />
            </div>
            <span className="text-sm text-slate-500">Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{assignedJobs.length}</div>
          <div className="text-xs text-slate-400">Scheduled jobs</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
            <span className="text-sm text-slate-500">This Week</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">${earnings.thisWeek.toFixed(2)}</div>
          <div className="text-xs text-slate-400">From completed</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="text-amber-600" size={20} />
            </div>
            <span className="text-sm text-slate-500">Pending Payout</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">${earnings.pendingPayout.toFixed(2)}</div>
          <div className="text-xs text-slate-400">Sent weekly</div>
        </div>
      </div>

      {/* Today's schedule — clickable, expand-in-place */}
      {todaysJobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="text-[#22C55E]" size={18} />
            Today's Schedule
          </h2>
          <div className="space-y-2">
            {todaysJobs.map((job) => {
              const isExpanded = expandedJob === job.id
              return (
                <div
                  key={job.id}
                  className={`rounded-lg border transition-colors ${
                    isExpanded
                      ? 'bg-white border-[#22C55E] shadow-md'
                      : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="text-blue-600" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">
                          {job.customer_name || 'Customer'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {job.scheduled_time_window || 'Time TBD'} · {job.address_line || 'Address TBD'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                      {formatBookingStatus(job.booking_status)}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                      <div className="text-xs text-slate-500 space-y-1.5 mt-2">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={12} />
                          {job.address_line}{job.address_city && `, ${job.address_city}`}{job.address_state && `, ${job.address_state}`}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-700">Service:</span> {yardSizeLabel(job.yard_size_category)} · {serviceTypeLabel(job.service_type)} · {serviceFrequencyLabel(job.service_frequency)}
                        </p>
                        {Array.isArray((job as any).selected_addons) && (job as any).selected_addons.length > 0 && (
                          <div>
                            <p className="font-medium text-slate-700 mb-1">Customer add-ons:</p>
                            <AddonBadges selectedAddons={(job as any).selected_addons} variant="chips" />
                          </div>
                        )}
                        <p className="text-slate-600 pt-1">
                          <span className="font-medium text-slate-700">Your company:</span> {displayName}
                        </p>
                      </div>
                      <Link
                        to={`/pro/schedule?booking=${job.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#22C55E] font-medium mt-3 hover:underline"
                      >
                        Open full details
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* CTA — Available Jobs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Briefcase className="text-[#22C55E]" size={18} />
              Available Jobs
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {availableJobs.length === 0
                ? 'No jobs available right now. We\'ll notify you when new ones come in.'
                : `${availableJobs.length} ${availableJobs.length === 1 ? 'job' : 'jobs'} ready for you to accept`}
            </p>
          </div>
          <Link
            to="/pro/available"
            className="inline-flex items-center gap-2 bg-[#22C55E] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
          >
            {availableJobs.length > 0 ? 'Browse jobs' : 'View available'}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Coming up — clickable, expand-in-place */}
      {upcomingJobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900 mb-3">Coming up</h2>
          <div className="space-y-2">
            {upcomingJobs.map((job) => {
              const isExpanded = expandedJob === job.id
              return (
                <div
                  key={job.id}
                  className={`rounded-lg border transition-colors ${
                    isExpanded
                      ? 'bg-white border-[#22C55E] shadow-md'
                      : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="text-blue-600" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {job.customer_name || 'Customer'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.scheduled_date} {job.scheduled_time_window && `· ${job.scheduled_time_window}`}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                      {formatBookingStatus(job.booking_status)}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                      <div className="text-xs text-slate-500 space-y-1.5 mt-2">
                        <p className="flex items-center gap-1.5">
                          <MapPin size={12} />
                          {job.address_line}{job.address_city && `, ${job.address_city}`}{job.address_state && `, ${job.address_state}`}
                        </p>
                        <p className="text-slate-600">
                          <span className="font-medium text-slate-700">Service:</span> {yardSizeLabel(job.yard_size_category)} · {serviceTypeLabel(job.service_type)} · {serviceFrequencyLabel(job.service_frequency)}
                        </p>
                        {Array.isArray((job as any).selected_addons) && (job as any).selected_addons.length > 0 && (
                          <div>
                            <p className="font-medium text-slate-700 mb-1">Customer add-ons:</p>
                            <AddonBadges selectedAddons={(job as any).selected_addons} variant="chips" />
                          </div>
                        )}
                        <p className="text-slate-600 pt-1">
                          <span className="font-medium text-slate-700">Your company:</span> {displayName}
                        </p>
                      </div>
                      <Link
                        to={`/pro/schedule?booking=${job.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[#22C55E] font-medium mt-3 hover:underline"
                      >
                        Open full details
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
