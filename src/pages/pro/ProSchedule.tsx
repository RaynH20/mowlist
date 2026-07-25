import { useState } from 'react'
import { Calendar, Clock, MapPin, Phone, Home, Play, CheckCircle, Navigation, Check, Flag, Timer } from 'lucide-react'

interface ScheduledJob {
  id: number
  customer: string
  address: string
  city: string
  service: string
  payout: number
  time: string
  date: string
  day: string
  phone?: string
  status: 'scheduled' | 'en_route' | 'arrived' | 'in_progress' | 'completed'
  instructions?: string
}

type JobStatus = 'scheduled' | 'en_route' | 'arrived' | 'in_progress' | 'completed'

const statusSteps: { key: JobStatus; label: string; icon: any }[] = [
  { key: 'scheduled', label: 'Scheduled', icon: Calendar },
  { key: 'en_route', label: 'On the way', icon: Navigation },
  { key: 'arrived', label: 'Arrived', icon: Flag },
  { key: 'in_progress', label: 'Mowing', icon: Timer },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
]

export default function ProSchedule() {
  const [activeJob, setActiveJob] = useState<number | null>(null)
  const [upcomingJobs, setUpcomingJobs] = useState<ScheduledJob[]>([
    {
      id: 1,
      customer: 'Sarah Johnson',
      address: '123 Main St',
      city: 'Austin, TX',
      service: 'Lawn Mowing',
      payout: 35,
      time: '10:00 AM',
      date: 'March 10',
      day: 'Today',
      phone: '(512) 555-0101',
      status: 'scheduled',
      instructions: 'Front yard only. Park on street.',
    },
    {
      id: 2,
      customer: 'Michael Chen',
      address: '456 Oak Ave',
      city: 'Austin, TX',
      service: 'Lawn Mowing + Edging',
      payout: 45,
      time: '2:00 PM',
      date: 'March 10',
      day: 'Today',
      phone: '(512) 555-0102',
      status: 'scheduled',
      instructions: 'Gate code in door. Backyard accessible.',
    },
    {
      id: 3,
      customer: 'Emily Rodriguez',
      address: '789 Pine Rd',
      city: 'Austin, TX',
      service: 'Lawn Mowing',
      payout: 30,
      time: '9:00 AM',
      date: 'March 11',
      day: 'Tomorrow',
      phone: '(512) 555-0103',
      status: 'scheduled',
    },
    {
      id: 4,
      customer: 'David Kim',
      address: '321 Maple Dr',
      city: 'Austin, TX',
      service: 'Lawn Mowing + Leaf Removal',
      payout: 55,
      time: '11:00 AM',
      date: 'March 11',
      day: 'Tomorrow',
      phone: '(512) 555-0104',
      status: 'scheduled',
    },
  ])

  const updateJobStatus = (jobId: number, newStatus: JobStatus) => {
    setUpcomingJobs(jobs =>
      jobs.map(job =>
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    )
  }

  const getNextStatus = (currentStatus: JobStatus): JobStatus | null => {
    const currentIndex = statusSteps.findIndex(s => s.key === currentStatus)
    if (currentIndex < statusSteps.length - 1) {
      return statusSteps[currentIndex + 1].key
    }
    return null
  }

  const getActionLabel = (status: JobStatus): string => {
    switch (status) {
      case 'scheduled': return 'Start Job'
      case 'en_route': return 'Mark Arrived'
      case 'arrived': return 'Start Mowing'
      case 'in_progress': return 'Complete Job'
      case 'completed': return 'Completed'
      default: return 'Start'
    }
  }

  const getActionIcon = (status: JobStatus) => {
    switch (status) {
      case 'scheduled': return Play
      case 'en_route': return Flag
      case 'arrived': return Timer
      case 'in_progress': return CheckCircle
      case 'completed': return Check
      default: return Play
    }
  }

  const todayJobs = upcomingJobs.filter(j => j.day === 'Today')
  const tomorrowJobs = upcomingJobs.filter(j => j.day === 'Tomorrow')

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Schedule</h1>
        <p className="text-slate-500 text-sm">{upcomingJobs.length} jobs scheduled</p>
      </div>

      {/* Today's Jobs */}
      {todayJobs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-slate-900">Today</h2>
            <span className="text-sm text-slate-500">({todayJobs.length} jobs)</span>
          </div>
          <div className="space-y-4">
            {todayJobs.map((job) => {
              const currentStepIndex = statusSteps.findIndex(s => s.key === job.status)
              const ActionIcon = getActionIcon(job.status)
              const nextStatus = getNextStatus(job.status)

              return (
                <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  {/* Status Progress Bar */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex
                        const isCurrent = index === currentStepIndex
                        const StepIcon = step.icon

                        return (
                          <div key={step.key} className="flex items-center">
                            <div className={`flex flex-col items-center ${index > 0 ? 'ml-2 md:ml-4' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? job.status === 'completed'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-[#22C55E] text-white'
                                  : 'bg-slate-200 text-slate-400'
                              }`}>
                                <StepIcon size={14} />
                              </div>
                              <span className={`text-[10px] mt-1 hidden md:block ${isCompleted ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                {step.label}
                              </span>
                            </div>
                            {index < statusSteps.length - 1 && (
                              <div className={`w-4 md:w-8 h-0.5 mx-1 ${index < currentStepIndex ? 'bg-[#22C55E]' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Job Header */}
                  <div className="bg-gradient-to-r from-[#22C55E] to-emerald-600 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-white">
                        <p className="text-sm font-medium opacity-90">Scheduled for</p>
                        <p className="text-2xl font-bold">{job.time}</p>
                      </div>
                      <div className="text-right text-white">
                        <p className="text-sm font-medium opacity-90">Your Payout</p>
                        <p className="text-2xl font-bold">${job.payout}</p>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">{job.customer}</h3>
                        <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                          <MapPin size={14} />
                          {job.address}, {job.city}
                        </div>
                        {job.instructions && (
                          <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                            {job.instructions}
                          </div>
                        )}
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        {job.service}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {job.status !== 'completed' ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => nextStatus && updateJobStatus(job.id, nextStatus)}
                          className="flex-1 bg-[#22C55E] text-white py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                          <ActionIcon size={16} />
                          {getActionLabel(job.status)}
                        </button>
                        <a
                          href={`tel:${job.phone}`}
                          className="px-4 border border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center"
                        >
                          <Phone size={18} />
                        </a>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-center gap-2">
                        <CheckCircle className="text-green-600" size={20} />
                        <span className="font-semibold text-green-700">Job Completed!</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tomorrow's Jobs */}
      {tomorrowJobs.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">Tomorrow</h2>
            <span className="text-sm text-slate-500">({tomorrowJobs.length} jobs)</span>
          </div>
          <div className="space-y-3">
            {tomorrowJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{job.customer}</h3>
                      <p className="text-sm text-slate-500">{job.address}, {job.city}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={12} /> {job.time}
                        </span>
                        <span className="text-xs text-[#22C55E] font-medium">${job.payout}</span>
                      </div>
                    </div>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                    {job.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Jobs State */}
      {upcomingJobs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No upcoming jobs</h3>
          <p className="text-slate-500">Accept some jobs from the feed to fill your schedule.</p>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mt-6">
        <h3 className="font-semibold text-slate-900 mb-4">This Week</h3>
        <div className="grid grid-cols-7 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
            const dayJobs = upcomingJobs.filter(j => {
              const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(j.day === 'Today' ? new Date().toLocaleDateString('en-US', { weekday: 'short' }) : j.day === 'Tomorrow' ? new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'short' }) : '')
              return dayIndex === i
            }).length
            const isToday = i === new Date().getDay() - 1

            return (
              <div key={day} className="text-center">
                <p className={`text-xs mb-2 ${isToday ? 'font-semibold text-[#22C55E]' : 'text-slate-500'}`}>{day}</p>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm ${dayJobs > 0 ? 'bg-[#22C55E] text-white font-medium' : isToday ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                  {dayJobs > 0 ? dayJobs : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
