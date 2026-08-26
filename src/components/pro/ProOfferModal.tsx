import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient' // adjust to your actual supabase client import path
import { useAuth } from '../../lib/auth-context'
import { Check, X, Clock, MapPin, DollarSign, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function ProOfferModal() {
  const { user } = useAuth()
  const [activeOffer, setActiveOffer] = useState<any>(null)
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [processing, setProcessing] = useState<boolean>(false)

  useEffect(() => {
    if (!user) return

    // 1. Subscribe to real-time changes in the pending_offers table
    const channel = supabase
      .channel('pro-pending-offers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pending_offers',
          filter: `provider_id=eq.${user.id}`,
        },
        async (payload) => {
          const newOffer = payload.new
          // Double check that it has not expired or already been responded to
          const expiry = new Date(newOffer.expires_at).getTime()
          const now = new Date().getTime()
          if (expiry > now && !newOffer.response) {
            setActiveOffer(newOffer)
            fetchBookingDetails(newOffer.booking_id)
            const remaining = Math.max(0, Math.round((expiry - now) / 1000))
            setTimeLeft(remaining)
          }
        }
      )
      .subscribe()

    // 2. Fetch any currently active offer on mount in case they refreshed the page
    const checkActiveOffer = async () => {
      const { data, error } = await supabase
        .from('pending_offers')
        .select('*')
        .eq('provider_id', user.id)
        .is('response', null)
        .gt('expires_at', new Date().toISOString())
        .order('offered_at', { ascending: false })
        .limit(1)

      if (error) console.error('Error fetching active offer:', error)
      if (data && data.length > 0) {
        const offer = data[0]
        setActiveOffer(offer)
        fetchBookingDetails(offer.booking_id)
        const expiry = new Date(offer.expires_at).getTime()
        const now = new Date().getTime()
        setTimeLeft(Math.max(0, Math.round((expiry - now) / 1000)))
      }
    }

    checkActiveOffer()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Fetch booking context details for the modal
  const fetchBookingDetails = async (bookingId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, customer_profiles(display_name)')
      .eq('id', bookingId)
      .single()

    if (error) {
      console.error('Error fetching booking details:', error)
    } else {
      setBookingDetails(data)
    }
  }

  // Handle countdown timer ticking down
  useEffect(() => {
    if (!activeOffer || timeLeft <= 0) {
      if (timeLeft === 0 && activeOffer && !processing) {
        handleExpired()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [activeOffer, timeLeft, processing])

  const handleExpired = async () => {
    setActiveOffer(null)
    setBookingDetails(null)
    // The database trigger or pg_cron handles marked expired status, we just close the UI modal
  }

  const handleResponse = async (responseType: 'accepted' | 'declined') => {
    if (!activeOffer || processing) return
    setProcessing(true)

    try {
      // 1. Update the pending_offers table
      const { error: offerError } = await supabase
        .from('pending_offers')
        .update({
          response: responseType,
          responded_at: new Date().toISOString(),
        })
        .eq('id', activeOffer.id)

      if (offerError) throw offerError

      if (responseType === 'accepted') {
        // 2. Assign the booking to this provider and set state to assigned
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            provider_id: user.id,
            booking_status: 'provider_assigned',
          })
          .eq('id', activeOffer.booking_id)

        if (bookingError) throw bookingError

        toast.success('Job accepted! It has been added to your dashboard.', {
          icon: <Check className="h-5 w-5 text-emerald-500" />,
        })
        
        // Reload dashboard jobs if page contains a refresh function
        if (typeof window !== 'undefined') {
          window.location.reload()
        }
      } else {
        toast.info('Offer declined. We will find another job for you soon.')
      }
    } catch (err: any) {
      console.error('Error responding to offer:', err)
      toast.error(err.message || 'Failed to complete transaction. Try again.')
    } finally {
      setProcessing(false)
      setActiveOffer(null)
      setBookingDetails(null)
    }
  }

  if (!activeOffer || !bookingDetails) return null

  // Calculate earnings for the provider (80% of booking price since 20% is platform fee)
  const estimatedPayout = (bookingDetails.price * 0.8).toFixed(2)

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
        {/* Animated Timer Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 relative">
          <div 
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 animate-pulse">
              <Clock className="w-3.5 h-3.5" /> Real-Time Offer
            </span>
            <span className="text-xl font-bold text-slate-800">
              {timeLeft}s remaining
            </span>
          </div>

          {/* Financial Callout */}
          <div className="bg-emerald-50 rounded-2xl p-6 text-center mb-6 border border-emerald-100">
            <p className="text-emerald-700 text-sm font-medium uppercase tracking-wider">Your Estimated Earnings</p>
            <div className="flex items-center justify-center gap-1 mt-1 text-emerald-950">
              <DollarSign className="w-8 h-8 stroke-[3]" />
              <span className="text-4xl font-extrabold tracking-tight">{estimatedPayout}</span>
            </div>
            <p className="text-emerald-600 text-xs mt-1.5">Includes 20% platform commission split</p>
          </div>

          {/* Job Specifics */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lawn Address</h4>
                <p className="text-sm font-medium text-slate-800 mt-0.5">
                  {bookingDetails.street_address}, {bookingDetails.city}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block">YARD SIZE</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 capitalize">
                  {bookingDetails.yard_size || 'Standard'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 block">SERVICE TYPE</span>
                <span className="text-sm font-bold text-slate-700 mt-0.5 capitalize">
                  {bookingDetails.service_type || 'Mow & Trim'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleResponse('declined')}
              disabled={processing}
              className="flex-1 inline-flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors duration-150 disabled:opacity-50"
            >
              <X className="w-4 h-4" /> Decline
            </button>
            <button
              onClick={() => handleResponse('accepted')}
              disabled={processing}
              className="flex-1 inline-flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/20 transition-colors duration-150 disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Accept Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
