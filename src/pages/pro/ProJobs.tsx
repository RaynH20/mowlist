import { useState, useEffect } from 'react'
import { MapPin, Clock, DollarSign, Check, X, Home, Ruler, Briefcase, Calendar, TrendingUp, CheckCircle, ChevronDown, ChevronUp, Dog, Key, Camera, Timer, RefreshCw, Phone, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getAvailableJobs, getProviderAssignedJobs, acceptJob, declineJob, getProviderEarnings } from '../../lib/api'

interface Job {
  id: number
  customer: string
  address: string
  city: string
  service: string
  price: number
  payout: number
  distance: string
  time: string
  date: string
  lawnSize: string
  status: 'open' | 'scheduled' | 'completed'
  isRecurring: boolean
  instructions: string
  gateCode?: string
  hasDog: boolean
  duration: string
  photosRequired: boolean
  addOns: string[]
  instructionTags?: string[]
  instructionPhotos?: string[]
}

export default function ProJobs() {
  const { user } = useAuth()
  const [expandedJob, setExpandedJob] = useState<number | null>(null)
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableJobs, setAvailableJobs] = useState<Job[]>([])
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([])
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 })
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchJobs()
    }
  }, [user])

  const fetchJobs = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch available jobs
      const { data: jobs, error: jobsError } = await getAvailableJobs(user.id)
      if (!jobsError && jobs) {
        // Transform jobs to local format
        setAvailableJobs(jobs.map(job => ({
          id: parseInt(job.id.slice(0, 8), 16),
          customer: 'Customer',
          address: 'Address',
          city: 'City, ST',
          service: 'Lawn Mowing',
          price: job.estimated_price,
          payout: job.provider_payout_amount || job.estimated_price * 0.8,
          distance: '0.0 mi',
          time: job.scheduled_time_window || 'TBD',
          date: job.scheduled_date || 'TBD',
          lawnSize: job.yard_size_category,
          status: 'open',
          isRecurring: job.service_frequency !== 'one_time',
          instructions: job.notes || '',
          hasDog: false,
          duration: '30-45 min',
          photosRequired: false,
          addOns: [],
        })))
      }

      // Fetch assigned jobs
      const { data: assigned, error: assignedError } = await getProviderAssignedJobs(user.id)
      if (!assignedError && assigned) {
        setAssignedJobs(assigned.map(job => ({
          id: parseInt(job.id.slice(0, 8), 16),
          customer: 'Customer',
          address: 'Address',
          city: 'City, ST',
          service: 'Lawn Mowing',
          price: job.estimated_price,
          payout: job.provider_payout_amount || job.estimated_price * 0.8,
          distance: '0.0 mi',
          time: job.scheduled_time_window || 'TBD',
          date: job.scheduled_date || 'TBD',
          lawnSize: job.yard_size_category,
          status: 'scheduled',
          isRecurring: job.service_frequency !== 'one_time',
          instructions: job.notes || '',
          hasDog: false,
          duration: '30-45 min',
          photosRequired: false,
          addOns: [],
        })))
      }

      // Fetch earnings
      const { data: earningsData, error: earningsError } = await getProviderEarnings(user.id)
      if (!earningsError && earningsData) {
        setEarnings(earningsData)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (jobId: number) => {
    if (!user) return

    // Find the job in available jobs
    const job = availableJobs.find(j => j.id === jobId)
    if (job) {
      // Call the API to accept the job
      await acceptJob(user.id, jobId.toString())

      // Move from available to assigned
      setAvailableJobs(availableJobs.filter(j => j.id !== jobId))
      setAssignedJobs([...assignedJobs, { ...job, status: 'scheduled' }])
    }
  }

  const handleDecline = async (jobId: number) => {
    if (!user) return

    // Call the API to decline the job
    await declineJob(user.id, jobId.toString())

    // Remove from available jobs
    setAvailableJobs(availableJobs.filter(j => j.id !== jobId))
  }

  const onboardingItems = [
    { id: 1, title: 'Complete your profile', description: 'Add a photo and bio', completed: true, link: '/pro/profile' },
    { id: 2, title: 'Set your service area', description: 'Choose cities and radius', completed: true, link: '/pro/area' },
    { id: 3, title: 'Verify your identity', description: 'Upload ID and pass background check', completed: false, link: '/pro/profile' },
    { id: 4, title: 'Connect payout method', description: 'Add bank account or PayPal', completed: true, link: '/pro/profile' },
  ]

  const completedItemsCount = onboardingItems.filter(item => item.completed).length
  const allCompleted = completedItemsCount === onboardingItems.length

  const toggleExpand = (jobId: number) => {
    setExpandedJob(expandedJob === jobId ? null : jobId)
  }

  const openJobs = availableJobs.filter(j => j.status === 'open')

  return (
    <div className="p-4 md:p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Briefcase size={18} className="text-blue-600" />
            </div>
            <span className="text-xs text-slate-500">Available</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{openJobs.length}</div>
          <div className="text-xs text-slate-400">Jobs near you</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar size={18} className="text-green-600" />
            </div>
            <span className="text-xs text-slate-500">Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{assignedJobs.length}</div>
          <div className="text-xs text-slate-400">Scheduled jobs</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{completedCount}</div>
          <div className="text-xs text-slate-400">This month</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign size={18} className="text-green-600" />
            </div>
            <span className="text-xs text-slate-500">Earnings</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">${earnings.total}</div>
          <div className="text-xs text-slate-400">This month</div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      {!dismissedOnboarding && !allCompleted && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-blue-600" />
              <h3 className="font-semibold text-slate-900">Complete your profile to get more jobs</h3>
            </div>
            <button
              onClick={() => setDismissedOnboarding(true)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {onboardingItems.map((item) => (
              <a
                key={item.id}
                href={item.link}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                  item.completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.completed
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}>
                  {item.completed ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <AlertCircle size={16} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${item.completed ? 'text-green-900' : 'text-blue-900'}`}>
                    {item.title}
                  </div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-3 text-center">
            <span className="text-sm text-slate-500">
              {completedItemsCount} of {onboardingItems.length} completed
            </span>
          </div>
        </div>
      )}

      {/* Upcoming Scheduled Jobs */}
      {assignedJobs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Scheduled Jobs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignedJobs.map((job) => (
              <div key={job.id} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.customer}</h3>
                    <p className="text-sm text-slate-600">{job.address}, {job.city}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                    Confirmed
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {job.date}, {job.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer size={14} /> {job.duration}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                  <span className="text-sm text-slate-600">{job.service}</span>
                  <span className="font-bold text-green-700">${job.payout}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Jobs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Jobs Near You</h2>
        {openJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No jobs available</h3>
            <p className="text-slate-500">Check back soon for new opportunities in your area.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Card Header - Payout Emphasized */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs font-medium">Your Payout</p>
                      <p className="text-white text-3xl font-bold">${job.payout}</p>
                    </div>
                    <div className="text-right">
                      {job.isRecurring && (
                        <div className="flex items-center gap-1 text-green-100 text-xs mb-1">
                          <RefreshCw size={12} /> Recurring
                        </div>
                      )}
                      <p className="text-white/80 text-sm">Customer pays ${job.price}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{job.customer}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                        <MapPin size={14} />
                        {job.address}, {job.city}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(job.id)}
                      className="text-[#22C55E] text-sm font-medium flex items-center gap-1"
                    >
                      {expandedJob === job.id ? 'Hide details' : 'View details'}
                      {expandedJob === job.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {/* Job Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
                      {job.service}
                    </span>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Ruler size={12} /> {job.lawnSize}
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock size={12} /> {job.date}, {job.time}
                    </span>
                    <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Timer size={12} /> {job.duration}
                    </span>
                  </div>

                  {/* Distance */}
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                    <MapPin size={14} />
                    {job.distance} away
                  </div>

                  {/* Add-ons */}
                  {job.addOns.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Add-ons included:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.addOns.map((addon, idx) => (
                          <span key={idx} className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                            + {addon}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedJob === job.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      {/* Instruction Tags */}
                      {job.instructionTags && job.instructionTags.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-amber-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Important Notes</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {job.instructionTags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                                  {tag === 'pets' && '🐶 Pets'}
                                  {tag === 'locked_gate' && '🔒 Locked Gate'}
                                  {tag === 'obstacles' && '⚠️ Obstacles'}
                                  {tag === 'fragile' && '🌷 Fragile Landscaping'}
                                  {tag === 'call_first' && '📞 Call Before Arrival'}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Instruction Photos */}
                      {job.instructionPhotos && job.instructionPhotos.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Camera size={16} className="text-blue-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Customer Photos</p>
                            <div className="flex gap-2 mt-1">
                              {job.instructionPhotos.map((photo, idx) => (
                                <img key={idx} src={photo} alt={`Instruction ${idx + 1}`} className="w-16 h-16 object-cover rounded-lg" />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {job.instructions && (
                        <div className="flex items-start gap-2">
                          <Key size={16} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500">Special Instructions</p>
                            <p className="text-sm text-slate-700">{job.instructions}</p>
                          </div>
                        </div>
                      )}
                      {job.gateCode && (
                        <div className="flex items-center gap-2">
                          <Key size={16} className="text-slate-400" />
                          <div>
                            <p className="text-xs text-slate-500">Gate Code</p>
                            <p className="text-sm font-medium text-slate-900">{job.gateCode}</p>
                          </div>
                        </div>
                      )}
                      {job.hasDog && (
                        <div className="flex items-center gap-2">
                          <Dog size={16} className="text-amber-500" />
                          <span className="text-sm text-amber-700 font-medium">Dog on property - proceed with caution</span>
                        </div>
                      )}
                      {job.photosRequired && (
                        <div className="flex items-center gap-2">
                          <Camera size={16} className="text-blue-500" />
                          <span className="text-sm text-blue-700 font-medium">Completion photos required</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAccept(job.id)}
                      className="flex-1 bg-[#22C55E] text-white py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Check size={18} /> Accept
                    </button>
                    <button
                      onClick={() => handleDecline(job.id)}
                      className="flex-1 border border-slate-300 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <X size={18} /> Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
