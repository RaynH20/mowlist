import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon, Camera, XCircle } from 'lucide-react'
import type { BookingPhoto } from '../lib/database.types'
import type { Addon } from '../lib/addons'
import { hydrateAddons } from '../lib/addons'
import { getBookingPhotos, getReviewForBooking } from '../lib/api'

interface CustomerPhotoViewerProps {
  bookingId: string
  /** Add-ons the customer selected (raw from booking.selected_addons) */
  selectedAddons?: any[] | null
  /** Approval status of the job — used to show the "approved" or "disputed"
   * badge on each photo row so the customer can see which photos were part
   * of an approved job vs a disputed one. */
  reviewStatus?: 'pending' | 'approved' | 'disputed' | 'none'
}

interface ServiceView {
  key: string
  label: string
  icon: string
  before?: BookingPhoto
  after?: BookingPhoto
  extras: BookingPhoto[]
  /** True if BOTH before + after are uploaded for this service */
  isComplete: boolean
}

/**
 * Customer-side photo viewer. Groups photos by service (Base Mowing + each
 * addon) so the customer can clearly see what was done for each service.
 * Each service shows explicit Before/After slots, an approved/disputed badge
 * per service, and any extra context photos below.
 */
export default function CustomerPhotoViewer({
  bookingId,
  selectedAddons = [],
  reviewStatus = 'none',
}: CustomerPhotoViewerProps) {
  const [photos, setPhotos] = useState<BookingPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getBookingPhotos(bookingId).then(({ data }) => {
      if (cancelled) return
      setPhotos((data || []) as BookingPhoto[])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [bookingId])

  const addons: Addon[] = useMemo(() => hydrateAddons(selectedAddons), [selectedAddons])

  const services: ServiceView[] = useMemo(() => {
    const basePhotos = photos.filter((p) => p.addon_id === null || p.addon_id === '')
    const list: ServiceView[] = [
      {
        key: 'base',
        label: 'Lawn Mowing',
        icon: '🌱',
        before: basePhotos.find((p) => p.photo_role === 'before'),
        after: basePhotos.find((p) => p.photo_role === 'after'),
        extras: basePhotos.filter((p) => p.photo_role === 'during' || p.photo_role === 'reference' || p.photo_role === 'issue'),
        isComplete: !!basePhotos.find((p) => p.photo_role === 'before') && !!basePhotos.find((p) => p.photo_role === 'after'),
      },
    ]
    for (const addon of addons) {
      const addonPhotos = photos.filter((p) => p.addon_id === addon.id)
      list.push({
        key: addon.id,
        label: addon.name,
        icon: addon.icon,
        before: addonPhotos.find((p) => p.photo_role === 'before'),
        after: addonPhotos.find((p) => p.photo_role === 'after'),
        extras: addonPhotos.filter((p) => p.photo_role === 'during' || p.photo_role === 'reference' || p.photo_role === 'issue'),
        isComplete: !!addonPhotos.find((p) => p.photo_role === 'before') && !!addonPhotos.find((p) => p.photo_role === 'after'),
      })
    }
    return list
  }, [photos, addons])

  if (loading) {
    return (
      <div className="text-sm text-slate-500 italic flex items-center gap-2">
        <Loader2 className="animate-spin" size={14} />
        Loading photos…
      </div>
    )
  }

  // Total photos uploaded (for the counter at the bottom)
  const totalPhotos = photos.length
  const completedServices = services.filter((s) => s.isComplete).length
  const totalServices = services.length

  if (totalPhotos === 0) {
    return (
      <div className="text-sm text-slate-400 italic flex items-center gap-2">
        <ImageIcon size={14} />
        No photos yet
      </div>
    )
  }

  return (
    <div>
      {/* Service rows */}
      <div className="space-y-4">
        {services.map((svc) => (
          <div
            key={svc.key}
            className={`rounded-xl border p-4 ${
              reviewStatus === 'disputed' ? 'border-red-200 bg-red-50/30'
                : reviewStatus === 'approved' ? 'border-emerald-200 bg-emerald-50/30'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>{svc.icon}</span>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{svc.label}</div>
                  <div className="text-xs text-slate-500">
                    {svc.isComplete
                      ? `Before + After uploaded${svc.extras.length > 0 ? ` · ${svc.extras.length} extra${svc.extras.length > 1 ? 's' : ''}` : ''}`
                      : svc.before && !svc.after
                        ? 'Before uploaded · waiting for After'
                        : !svc.before && svc.after
                          ? 'After uploaded · missing Before'
                          : 'Awaiting photos'}
                  </div>
                </div>
              </div>
              {svc.isComplete && reviewStatus !== 'none' && (
                <ServiceBadge status={reviewStatus} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PhotoPanel label="Before" photo={svc.before} onView={setSelectedPhoto} />
              <PhotoPanel label="After" photo={svc.after} onView={setSelectedPhoto} />
            </div>

            {/* Extras */}
            {svc.extras.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {svc.extras.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPhoto(p.photo_url)}
                    className="aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-[#22C55E] transition-colors"
                    aria-label="View extra photo"
                  >
                    <img src={p.photo_url} alt="Extra" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary counter */}
      <p className="text-xs text-slate-500 mt-3 text-center">
        {completedServices} of {totalServices} services complete · {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} total
      </p>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"
            onClick={() => setSelectedPhoto(null)}
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <div className="max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedPhoto}
              alt="Photo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoPanel({ label, photo, onView }: { label: string; photo?: BookingPhoto; onView: (url: string) => void }) {
  const isBefore = label === 'Before'
  const accent = isBefore ? 'bg-blue-500' : 'bg-[#22C55E]'
  if (photo) {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${accent}`}>
            {label}
          </span>
          <CheckCircle2 className="text-emerald-500" size={14} />
        </div>
        <button
          onClick={() => onView(photo.photo_url)}
          className="w-full aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-[#22C55E] transition-colors block"
        >
          <img src={photo.photo_url} alt={label} className="w-full h-full object-cover" />
        </button>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${accent} opacity-50`}>
          {label}
        </span>
        <AlertCircle className="text-slate-300" size={14} />
      </div>
      <div className="w-full aspect-square rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-300 bg-slate-50">
        <Camera size={20} />
        <span className="text-xs">No {label.toLowerCase()} photo</span>
      </div>
    </div>
  )
}

function ServiceBadge({ status }: { status: 'pending' | 'approved' | 'disputed' }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={12} />
        Approved
      </span>
    )
  }
  if (status === 'disputed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
        <XCircle size={12} />
        Disputed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
      <AlertCircle size={12} />
      Pending
    </span>
  )
}
