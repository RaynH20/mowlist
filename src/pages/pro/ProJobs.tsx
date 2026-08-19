import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  MapPin, Clock, DollarSign, Check, X, Briefcase, Calendar,
  CheckCircle, ChevronDown, ChevronUp, RefreshCw, Phone, AlertCircle,
  User, Mail, Loader2, ExternalLink, CreditCard, Camera, Image as ImageIcon, FileText,
  Shield, Upload
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { acceptJob, declineJob, updateProviderProfile, getProviderProfile } from '../../lib/api'
import {
  getAvailableJobsWithDetails,
  getProAssignedJobsWithDetails,
  updateBookingProgress,
  markReadyForReview,
  type ProBookingWithDetails
} from '../../lib/proDashboard'
import { serviceTypeLabel, yardSizeLabel } from '../../lib/labels'
import JobPhotoGallery from '../../components/JobPhotoGallery'
import PerServicePhotoUploader from '../../components/PerServicePhotoUploader'
import ProJobCard from '../../components/ProJobCard'
import ProStatusStepper from '../../components/ProStatusStepper'
import AddonBadges from '../../components/AddonBadges'
import { hydrateAddons } from '../../lib/addons'
import { useProLocation } from '../../hooks/useProLocation'
import { checkGeofence } from '../../lib/geo'

export default function ProJobs() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const bookingIdFromUrl = searchParams.get('booking')
  // Auto-expand the booking passed in URL (e.g. from "Manage photos" link)
  const [expandedJob, setExpandedJob] = useState<string | null>(bookingIdFromUrl)
  const [loading, setLoading] = useState(true)
  const [availableJobs, setAvailableJobs] = useState<ProBookingWithDetails[]>([])
  const [assignedJobs, setAssignedJobs] = useState<ProBookingWithDetails[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  // Stripe Connect onboarding state — shows a banner if not fully set up
  const [stripeReady, setStripeReady] = useState<boolean | null>(null)
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetchJobs()
  }, [user])

  const fetchJobs = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [availRes, assignedRes, profileRes] = await Promise.all([
        getAvailableJobsWithDetails(),
        getProAssignedJobsWithDetails(user.id),
        getProviderProfile(user.id),
      ])
      if (availRes.error) console.error('Error loading available jobs:', availRes.error)
      if (assignedRes.error) console.error('Error loading assigned jobs:', assignedRes.error)
      setAvailableJobs(availRes.data || [])
      setAssignedJobs(assignedRes.data || [])
      // Compute Stripe Connect readiness for the banner
      const pd: any = profileRes.data
      setStripeConnectAccountId(pd?.stripe_connect_account_id || null)
      setStripeReady(
        !!(pd?.stripe_connect_charges_enabled && pd?.stripe_connect_payouts_enabled)
      )
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string, durationMs: number = 4000) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), durationMs)
  }

  const handleAccept = async (job: ProBookingWithDetails) => {
    if (!user) return
    setActionInProgress(job.id)
    const { data, error } = await acceptJob(user.id, job.id)
    setActionInProgress(null)
    if (error) {
      showToast('error', `Couldn't accept job: ${error.message}`)
      return
    }
    showToast('success', `Accepted ${job.customer_name || 'job'}!`)
    setAvailableJobs(availableJobs.filter(j => j.id !== job.id))
    setAssignedJobs([...assignedJobs, { ...job, booking_status: 'provider_assigned' }])
  }

  const handleDecline = async (job: ProBookingWithDetails) => {
    if (!user) return
    setActionInProgress(job.id)
    const { error } = await declineJob(user.id, job.id)
    setActionInProgress(null)
    if (error) {
      showToast('error', `Couldn't decline: ${error.message}`)
      return
    }
    showToast('success', 'Job declined.')
    setAvailableJobs(availableJobs.filter(j => j.id !== job.id))
  }

  const handleProgressUpdate = async (job: ProBookingWithDetails, newStatus: 'on_the_way' | 'arrived' | 'in_progress' | 'completed') => {
    setActionInProgress(job.id)
    // Geofence check: only when marking complete
    if (newStatus === 'completed') {
      // Pull the customer's address coordinates (might be on job.address_* or via the booking's address_id)
      const customerLat = (job as any).address_latitude
      const customerLng = (job as any).address_longitude
      const proLat = (job as any).pro_lat
      const proLng = (job as any).pro_lng
      const proPingedAt = (job as any).pro_pinged_at || (lastPingAt ? new Date(lastPingAt).toISOString() : null)

      if (customerLat == null || customerLng == null) {
        // Address wasn't geocoded (legacy booking). Allow but warn.
        console.warn('Customer address not geocoded — skipping geofence check for booking', job.id)
      } else {
        const geofence = checkGeofence({
          customerLat,
          customerLng,
          proLat,
          proLng,
          proPingedAt,
        })
        if (!geofence.ok) {
          setActionInProgress(null)
          showToast('error', geofence.message, 8000)
          return
        }
        // Optional: log the distance for analytics
        console.log(`Geofence OK: ${geofence.distanceMeters?.toFixed(0)}m from job site`)
      }
    }
    const { error } = await updateBookingProgress(job.id, newStatus)
    setActionInProgress(null)
    if (error) {
      showToast('error', `Couldn't update: ${error.message}`)
      return
    }
    const label = {
      on_the_way: "You're on the way!",
      arrived: 'Marked as arrived.',
      in_progress: 'Job in progress.',
      completed: 'Marked complete! Great work.',
    }[newStatus]
    showToast('success', label)
    setAssignedJobs(
      assignedJobs.map(j => (j.id === job.id ? { ...j, booking_status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : j.completed_at } : j))
    )
  }

  // Pro marks the job as done — validates all required photos are uploaded
  // and transitions to 'pending_review' (24h customer escrow window).
  const handleMarkReadyForReview = async (job: ProBookingWithDetails) => {
    setActionInProgress(job.id)
    const { error, missing } = await markReadyForReview(job.id)
    setActionInProgress(null)
    if (error) {
      if (missing && missing.length > 0) {
        showToast('error', `Missing photos: ${missing.join(', ')}`, 10000)
      } else {
        showToast('error', error.message, 8000)
      }
      return
    }
    showToast('success', 'Marked ready for review! Customer has 24h to approve.', 6000)
    setAssignedJobs(
      assignedJobs.map(j => (j.id === job.id ? { ...j, booking_status: 'pending_review' as const } : j))
    )
  }

  const toggleAvailability = async () => {
    const next = !isAvailable
    setIsAvailable(next)
    if (user) {
      await updateProviderProfile(user.id, { is_available: next } as any)
      showToast('success', next ? 'You are now accepting jobs' : 'You are paused — no new jobs will be assigned')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const formatAddress = (job: ProBookingWithDetails) => {
    const parts = [job.address_line, job.address_city, job.address_state].filter(Boolean)
    return parts.join(', ') || 'Address unavailable'
  }

  // Filter assigned jobs into active vs done
  const activeAssigned = assignedJobs.filter(j => j.booking_status !== 'completed')
  const completedAssigned = assignedJobs.filter(j => j.booking_status === 'completed')

  // The "active" booking (in service right now) is the one whose status is
  // on_the_way, arrived, or in_progress. We use this to drive live tracking
  // and the geofence check.
  const ACTIVE_STATUSES = ['on_the_way', 'arrived', 'in_progress']
  const activeBooking = assignedJobs.find(j => ACTIVE_STATUSES.includes(j.booking_status as string))
  const activeBookingId = activeBooking?.id || null

  // Start live location tracking while there's an active booking
  const {
    isTracking: isLocationTracking,
    permissionGranted: locationPermission,
    error: locationError,
    lastPingAt: lastPingAt,
  } = useProLocation({ bookingId: activeBookingId, intervalMs: 30_000 })

  // Stats
  const openJobs = availableJobs.filter(j => isAvailable)

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#22C55E] mx-auto mb-3" />
          <p className="text-slate-500">Loading jobs…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium animate-pulse ${
            toast.type === 'success' ? 'bg-[#22C55E]' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Stripe Connect onboarding banner — shown when pro isn't fully set up */}
      {stripeReady === false && (
        <Link
          to="/pro/profile"
          className="block bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-4 mb-6 hover:border-amber-300 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="text-white" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">
                {stripeConnectAccountId
                  ? 'Finish your Stripe setup to start earning'
                  : 'Set up payouts to start accepting jobs'}
              </p>
              <p className="text-xs text-amber-800 mt-1">
                {stripeConnectAccountId
                  ? "You've started Stripe onboarding but haven't finished yet. Complete it to receive payments."
                  : "MowList uses Stripe to pay you directly. It takes about 3 minutes — you'll need your bank account and ID."}
              </p>
            </div>
            <ExternalLink className="text-amber-600 flex-shrink-0" size={18} />
          </div>
        </Link>
      )}

      {/* Availability toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {isAvailable ? '🟢 You are accepting jobs' : '⏸️ You are paused'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isAvailable
              ? 'New jobs in your service area will appear below.'
              : 'Toggle on to start seeing and accepting jobs again.'}
          </p>
        </div>
        <button
          onClick={toggleAvailability}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isAvailable
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-[#22C55E] text-white hover:bg-[#16A34A]'
          }`}
        >
          {isAvailable ? 'Pause' : 'Go online'}
        </button>
      </div>

      {/* Location tracking indicator (only when there's an active booking) */}
      {activeBookingId && (
        <div className={`rounded-xl border p-3 mb-6 flex items-start gap-3 ${
          locationPermission === false
            ? 'bg-red-50 border-red-200'
            : isLocationTracking
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            locationPermission === false
              ? 'bg-red-500'
              : isLocationTracking
              ? 'bg-[#22C55E]'
              : 'bg-amber-500'
          }`}>
            <MapPin className="text-white" size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${
              locationPermission === false
                ? 'text-red-900'
                : isLocationTracking
                ? 'text-green-900'
                : 'text-amber-900'
            }`}>
              {locationPermission === false
                ? 'Location required to mark jobs complete'
                : isLocationTracking
                ? 'Live location sharing is on'
                : 'Waiting for location…'}
            </p>
            <p className={`text-xs mt-0.5 ${
              locationPermission === false
                ? 'text-red-700'
                : isLocationTracking
                ? 'text-green-700'
                : 'text-amber-700'
            }`}>
              {locationPermission === false
                ? 'Turn on location in your browser to continue. We use it to verify you\'re at the job site.'
                : isLocationTracking
                ? 'Your customer can see where you are. We\'ll verify you\'re at the address when you mark complete.'
                : locationError || 'Please allow location access when prompted.'}
            </p>
          </div>
          {isLocationTracking && (
            <span className="text-xs text-green-700 font-medium flex-shrink-0 flex items-center gap-1">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
      )}

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
          <div className="text-xs text-slate-400">Jobs in your area</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <Calendar size={18} className="text-green-600" />
            </div>
            <span className="text-xs text-slate-500">Upcoming</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeAssigned.length}</div>
          <div className="text-xs text-slate-400">Scheduled jobs</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle size={18} className="text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{completedAssigned.length}</div>
          <div className="text-xs text-slate-400">All time</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign size={18} className="text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">All-time Earned</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${assignedJobs
              .filter(j => j.booking_status === 'completed')
              .reduce((sum, j) => sum + (j.provider_payout_amount || 0), 0)
              .toFixed(2)}
          </div>
          <div className="text-xs text-slate-400">From completed jobs</div>
        </div>
      </div>

      {/* Available Jobs — main thing the pro should see, at the top */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Available Jobs {!isAvailable && <span className="text-sm font-normal text-slate-500">(paused)</span>}
        </h2>
        {openJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {isAvailable ? 'No jobs available right now' : 'You are paused'}
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {isAvailable
                ? "We'll show new jobs here as they come in. Check back soon!"
                : 'Toggle "Go online" above to start seeing and accepting jobs again.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {openJobs.map((job) => (
              <AvailableJobCard
                key={job.id}
                job={job}
                expanded={expandedJob === job.id}
                onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                onAccept={() => handleAccept(job)}
                onDecline={() => handleDecline(job)}
                actionInProgress={actionInProgress === job.id}
                formatDate={formatDate}
                formatAddress={formatAddress}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Scheduled Jobs — pro's already-accepted work */}
      {activeAssigned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Upcoming Jobs</h2>
          <div className="space-y-3">
            {activeAssigned.map((job) => (
              <ProJobCard
                key={job.id}
                job={job}
                expanded={expandedJob === job.id}
                onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                onUpdate={handleProgressUpdate}
                onMarkReadyForReview={handleMarkReadyForReview}
                actionInProgress={actionInProgress === job.id}
                onPhotoUploaded={() => fetchJobs()}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

function AvailableJobCard({
  job, expanded, onToggle, onAccept, onDecline, actionInProgress, formatDate, formatAddress,
}: {
  job: ProBookingWithDetails
  expanded: boolean
  onToggle: () => void
  onAccept: () => void
  onDecline: () => void
  actionInProgress: boolean
  formatDate: (d: string | null) => string
  formatAddress: (j: ProBookingWithDetails) => string
}) {
  const payout = job.provider_payout_amount ?? (job.estimated_price * 0.8)
  const isRecurring = job.service_frequency && job.service_frequency !== 'one_time'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Card Header - Payout Emphasized */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-xs font-medium">Your Payout</p>
            <p className="text-white text-3xl font-bold">${payout.toFixed(2)}</p>
          </div>
          <div className="text-right">
            {isRecurring && (
              <div className="flex items-center gap-1 text-green-100 text-xs mb-1 justify-end">
                <RefreshCw size={12} /> Recurring ({job.service_frequency})
              </div>
            )}
            <p className="text-white/80 text-sm">Customer pays ${job.estimated_price.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {job.customer_avatar_url ? (
              <img
                src={job.customer_avatar_url}
                alt={job.customer_name || 'Customer'}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#22C55E] to-[#1E40AF] text-white font-semibold flex items-center justify-center text-sm">
                {(job.customer_name || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{job.customer_name || 'Customer'}</h3>
              <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                <MapPin size={14} />
                {formatAddress(job)}
              </div>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-[#22C55E] text-sm font-medium flex items-center gap-1"
          >
            {expanded ? 'Hide details' : 'View details'}
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium">
            {serviceTypeLabel(job.service_type)}
          </span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
            {yardSizeLabel(job.yard_size_category)}
          </span>
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            {formatDate(job.scheduled_date)} · {job.scheduled_time_window || 'Time TBD'}
          </span>
        </div>

        {/* Add-ons the customer selected (lawn mowing only) */}
        {Array.isArray((job as any).selected_addons) && (job as any).selected_addons.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1.5">Customer add-ons</p>
            <AddonBadges selectedAddons={(job as any).selected_addons} variant="chips" />
          </div>
        )}

        {expanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
            {job.notes && (
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Special Instructions</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{job.notes}</p>
                </div>
              </div>
            )}
            {job.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-slate-400" />
                <a href={`tel:${job.customer_phone}`} className="text-sm text-blue-600 hover:underline">
                  {job.customer_phone}
                </a>
              </div>
            )}
            {job.customer_email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-slate-400" />
                <a href={`mailto:${job.customer_email}`} className="text-sm text-blue-600 hover:underline">
                  {job.customer_email}
                </a>
              </div>
            )}
            <div className="flex items-start gap-2 pt-2">
              <ExternalLink size={14} className="text-slate-400 mt-0.5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatAddress(job))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onAccept}
            disabled={actionInProgress}
            className="flex-1 bg-[#22C55E] text-white py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {actionInProgress ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Accept
          </button>
          <button
            onClick={onDecline}
            disabled={actionInProgress}
            className="flex-1 border border-slate-300 text-slate-600 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <X size={18} /> Decline
          </button>
        </div>
      </div>
    </div>
  )
}

// NOTE: the old in-file `AssignedJobCard` was removed on 2026-08-18. It had been
// dead since assigned jobs moved to the shared <ProJobCard> component, and it
// still referenced a `fetchJobs` that does not exist in its scope — so anyone
// re-enabling it would have hit a ReferenceError on photo upload.


function getStatusInfo(status: string): { label: string; bgClass: string; badgeClass: string } {
  switch (status) {
    case 'provider_assigned':
      return {
        label: 'Confirmed',
        bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100',
        badgeClass: 'bg-green-100 text-green-700',
      }
    case 'on_the_way':
      return {
        label: 'On the way',
        bgClass: 'bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100',
        badgeClass: 'bg-blue-100 text-blue-700',
      }
    case 'arrived':
      return {
        label: 'Arrived',
        bgClass: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100',
        badgeClass: 'bg-amber-100 text-amber-700',
      }
    case 'in_progress':
      return {
        label: 'In progress',
        bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100',
        badgeClass: 'bg-green-100 text-green-700',
      }
    case 'completed':
      return {
        label: 'Completed',
        bgClass: 'bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100',
        badgeClass: 'bg-slate-200 text-slate-700',
      }
    default:
      return {
        label: status,
        bgClass: 'bg-slate-50',
        badgeClass: 'bg-slate-100 text-slate-600',
      }
  }
}

function getNextStep(currentStatus: string): { action: 'on_the_way' | 'arrived' | 'in_progress' | 'completed'; label: string } | null {
  switch (currentStatus) {
    case 'provider_assigned':
      return { action: 'on_the_way', label: "I'm on the way" }
    case 'on_the_way':
      return { action: 'arrived', label: "I've arrived" }
    case 'arrived':
      return { action: 'in_progress', label: 'Start work' }
    case 'in_progress':
      return { action: 'completed', label: 'Mark complete' }
    default:
      return null
  }
}
