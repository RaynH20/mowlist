import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, Phone, Loader2, CheckCircle,
  ChevronRight, ExternalLink, Filter, User, ChevronDown, ChevronUp
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getProAssignedJobsWithDetails, type ProBookingWithDetails } from '../../lib/proDashboard'
import { serviceTypeLabel, yardSizeLabel } from '../../lib/labels'
import JobPhotoGallery from '../../components/JobPhotoGallery'

type StatusFilter = 'all' | 'active' | 'completed'

export default function ProSchedule() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<ProBookingWithDetails[]>([])
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchParams] = useSearchParams()
  const urlBookingId = searchParams.get('booking')
  const [expandedJob, setExpandedJob] = useState<string | null>(urlBookingId)

  useEffect(() => {
    if (user) fetchJobs()
  }, [user])

  const fetchJobs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await getProAssignedJobsWithDetails(user.id)
      if (error) console.error('Schedule fetch error:', error)
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group jobs by date
  const jobsByDate = useMemo(() => {
    const filtered = jobs.filter(j => {
      if (filter === 'all') return true
      if (filter === 'active') return j.booking_status !== 'completed'
      if (filter === 'completed') return j.booking_status === 'completed'
      return true
    })
    const groups = new Map<string, ProBookingWithDetails[]>()
    for (const job of filtered) {
      const dateKey = job.scheduled_date || 'Unscheduled'
      if (!groups.has(dateKey)) groups.set(dateKey, [])
      groups.get(dateKey)!.push(job)
    }
    // Sort each group by time
    for (const list of groups.values()) {
      list.sort((a, b) => (a.scheduled_time_window || '').localeCompare(b.scheduled_time_window || ''))
    }
    // Sort dates
    return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)))
  }, [jobs, filter])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr || dateStr === 'Unscheduled') return dateStr || 'Unscheduled'
    try {
      const d = new Date(dateStr)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const jobDay = new Date(d)
      jobDay.setHours(0, 0, 0, 0)

      if (jobDay.getTime() === today.getTime()) return 'Today'
      if (jobDay.getTime() === tomorrow.getTime()) return 'Tomorrow'

      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const isToday = (dateStr: string | null) => {
    if (!dateStr) return false
    try {
      const d = new Date(dateStr)
      const today = new Date()
      return d.getFullYear() === today.getFullYear() &&
             d.getMonth() === today.getMonth() &&
             d.getDate() === today.getDate()
    } catch {
      return false
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#22C55E]" />
      </div>
    )
  }

  const totalActive = jobs.filter(j => j.booking_status !== 'completed').length
  const totalCompleted = jobs.filter(j => j.booking_status === 'completed').length

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
        <p className="text-slate-500 mt-1">All your upcoming and recent jobs</p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto">
        <Filter size={16} className="text-slate-400 flex-shrink-0" />
        <FilterChip
          label={`All (${jobs.length})`}
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterChip
          label={`Active (${totalActive})`}
          active={filter === 'active'}
          onClick={() => setFilter('active')}
        />
        <FilterChip
          label={`Completed (${totalCompleted})`}
          active={filter === 'completed'}
          onClick={() => setFilter('completed')}
        />
      </div>

      {jobsByDate.size === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center">
          <Calendar size={40} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-semibold text-slate-900">Nothing scheduled</h3>
          <p className="text-slate-500 text-sm mt-1">
            {filter === 'completed'
              ? "You haven't completed any jobs yet."
              : filter === 'active'
              ? "No active jobs right now."
              : "Accept a job from the Jobs tab to see it here."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(jobsByDate.entries()).map(([date, dateJobs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-slate-50/90 backdrop-blur py-2 z-10">
                <h3 className="text-sm font-semibold text-slate-700">
                  {formatDate(date)}
                </h3>
                {isToday(date) && (
                  <span className="text-xs font-semibold bg-[#22C55E] text-white px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
                <span className="text-xs text-slate-500 ml-auto">
                  {dateJobs.length} job{dateJobs.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-2">
                {dateJobs.map((job) => (
                  <ScheduleRow
                    key={job.id}
                    job={job}
                    expanded={expandedJob === job.id}
                    onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-[#22C55E] text-white'
          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function ScheduleRow({ job, expanded, onToggle }: { job: ProBookingWithDetails; expanded: boolean; onToggle: () => void }) {
  const status = getStatusBadge(job.booking_status)
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="text-center w-16 flex-shrink-0">
            <p className="text-xs text-slate-500">{job.scheduled_time_window?.split(' ')[1] || ''}</p>
            <p className="text-base font-bold text-slate-900">
              {job.scheduled_time_window?.split(' ')[0] || '—'}
            </p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-slate-900 truncate">
                {job.customer_name || 'Customer'}
              </p>
              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                {yardSizeLabel(job.yard_size_category)}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="flex-shrink-0" />
              {job.address_line ? `${job.address_line}, ` : ''}{job.address_city || '—'}, {job.address_state || ''}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">{serviceTypeLabel(job.service_type)}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${status.className}`}>
                {status.label}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <div>
              <p className="text-sm font-bold text-[#22C55E]">
                ${(job.provider_payout_amount || 0).toFixed(0)}
              </p>
              <p className="text-xs text-slate-400">earned</p>
            </div>
            {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 space-y-3">
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
          <JobPhotoGallery bookingId={job.id} allowUpload={false} compact />
          {/* Active jobs need photos + Mark Ready — link to ProJobs for that */}
          {['on_the_way', 'arrived', 'in_progress', 'pending_review'].includes(job.booking_status) && (
            <Link
              to="/pro/jobs"
              className="inline-flex items-center gap-1.5 text-sm text-[#22C55E] font-semibold hover:underline"
            >
              {job.booking_status === 'pending_review' ? 'View review status' : 'Manage photos & mark ready →'}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}


function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'provider_assigned':
      return { label: 'Confirmed', className: 'bg-green-100 text-green-700' }
    case 'on_the_way':
      return { label: 'On the way', className: 'bg-blue-100 text-blue-700' }
    case 'arrived':
      return { label: 'Arrived', className: 'bg-amber-100 text-amber-700' }
    case 'in_progress':
      return { label: 'In progress', className: 'bg-purple-100 text-purple-700' }
    case 'pending_review':
      return { label: 'Awaiting review', className: 'bg-amber-100 text-amber-700' }
    case 'completed':
      return { label: 'Completed', className: 'bg-slate-200 text-slate-700' }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-600' }
  }
}
