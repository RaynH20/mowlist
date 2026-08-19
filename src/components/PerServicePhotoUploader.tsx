import { useState, useRef, useEffect } from 'react'
import { Camera, X, Loader2, ImagePlus, Image as ImageIcon, Plus, Scissors } from 'lucide-react'
import type { BookingPhoto } from '../lib/database.types'
import type { Addon } from '../lib/addons'
import { uploadJobPhoto, getBookingPhotos, deleteBookingPhoto } from '../lib/api'

interface PerServicePhotoUploaderProps {
  bookingId: string
  /** The addons selected for this booking (base mow is always shown) */
  selectedAddons?: Addon[]
  /** Called whenever the photos change so the parent can update its state */
  onPhotosChange?: (photos: BookingPhoto[]) => void
  /** Called after a successful upload so the parent can re-fetch the booking
   * row (which carries the legacy before_photo_url/after_photo_url columns the
   * Mark complete / Start work buttons key off of). */
  onPhotoUploaded?: () => void
}

type PhotoRole = 'before' | 'after'
type ServiceKey = 'base' | string // 'base' for the mow, or addon id

interface ServiceState {
  key: ServiceKey
  label: string
  /** Photo URLs keyed by role (before/after) — undefined means missing */
  before?: string
  after?: string
  /** Raw photo rows (so we can delete them) keyed by role */
  beforeRow?: BookingPhoto
  afterRow?: BookingPhoto
  /** Extra (during) photo rows for this service */
  extras: BookingPhoto[]
}

const MAX_EXTRAS_PER_SERVICE = 3

/**
 * Per-service photo uploader for the pro side. Replaces the old single
 * gallery with one that has a clear visual row per service (Base Mowing
 * + each addon). Each row has explicit Before / After slots + an optional
 * "+ extra" button for additional context photos.
 */
export default function PerServicePhotoUploader({
  bookingId,
  selectedAddons = [],
  onPhotosChange,
  onPhotoUploaded,
}: PerServicePhotoUploaderProps) {
  const [services, setServices] = useState<ServiceState[]>([])
  const [loading, setLoading] = useState(true)
  const [photoToDelete, setPhotoToDelete] = useState<BookingPhoto | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null) // "base:before" etc.
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [pendingUpload, setPendingUpload] = useState<{ service: ServiceKey; role: PhotoRole | 'during' } | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  // Build the service list: base first, then addons in the order they were selected
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const { data: photos } = await getBookingPhotos(bookingId)
      if (cancelled) return
      const allPhotos = (photos || []) as BookingPhoto[]
      onPhotosChange?.(allPhotos)

      const list: ServiceState[] = [
        {
          key: 'base',
          label: 'Lawn Mowing',
          beforeRow: allPhotos.find((p) => (p.addon_id === null || p.addon_id === '') && p.photo_role === 'before'),
          afterRow: allPhotos.find((p) => (p.addon_id === null || p.addon_id === '') && p.photo_role === 'after'),
          before: allPhotos.find((p) => (p.addon_id === null || p.addon_id === '') && p.photo_role === 'before')?.photo_url,
          after: allPhotos.find((p) => (p.addon_id === null || p.addon_id === '') && p.photo_role === 'after')?.photo_url,
          extras: allPhotos.filter((p) => (p.addon_id === null || p.addon_id === '') && p.photo_role === 'during'),
        },
        ...selectedAddons.map((addon) => ({
          key: addon.id,
          label: addon.name,
          icon: addon.icon,
          beforeRow: allPhotos.find((p) => p.addon_id === addon.id && p.photo_role === 'before'),
          afterRow: allPhotos.find((p) => p.addon_id === addon.id && p.photo_role === 'after'),
          before: allPhotos.find((p) => p.addon_id === addon.id && p.photo_role === 'before')?.photo_url,
          after: allPhotos.find((p) => p.addon_id === addon.id && p.photo_role === 'after')?.photo_url,
          extras: allPhotos.filter((p) => p.addon_id === addon.id && p.photo_role === 'during'),
        })),
      ]
      setServices(list)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [bookingId, selectedAddons.length])

  const refresh = async () => {
    const { data: photos } = await getBookingPhotos(bookingId)
    const allPhotos = (photos || []) as BookingPhoto[]
    onPhotosChange?.(allPhotos)
    setServices((prev) =>
      prev.map((svc) => ({
        ...svc,
        beforeRow: allPhotos.find((p) => (svc.key === 'base' ? (p.addon_id === null || p.addon_id === '') : p.addon_id === svc.key) && p.photo_role === 'before'),
        afterRow: allPhotos.find((p) => (svc.key === 'base' ? (p.addon_id === null || p.addon_id === '') : p.addon_id === svc.key) && p.photo_role === 'after'),
        before: allPhotos.find((p) => (svc.key === 'base' ? (p.addon_id === null || p.addon_id === '') : p.addon_id === svc.key) && p.photo_role === 'before')?.photo_url,
        after: allPhotos.find((p) => (svc.key === 'base' ? (p.addon_id === null || p.addon_id === '') : p.addon_id === svc.key) && p.photo_role === 'after')?.photo_url,
        extras: allPhotos.filter((p) => (svc.key === 'base' ? (p.addon_id === null || p.addon_id === '') : p.addon_id === svc.key) && p.photo_role === 'during'),
      }))
    )
  }

  const triggerUpload = (service: ServiceKey, role: PhotoRole | 'during') => {
    setError(null)
    setPendingUpload({ service, role })
    setTimeout(() => cameraInputRef.current?.click(), 50)
  }

  const triggerGallery = (service: ServiceKey, role: PhotoRole | 'during') => {
    setError(null)
    setPendingUpload({ service, role })
    setTimeout(() => galleryInputRef.current?.click(), 50)
  }

  const handleFile = async (file: File) => {
    if (!pendingUpload || !file) return
    const { service, role } = pendingUpload
    setPendingUpload(null)

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }

    const uploadKey = `${service}:${role}`
    setUploading(uploadKey)
    const addonId = service === 'base' ? null : service
    const { error: upErr } = await uploadJobPhoto(bookingId, role, file, addonId)
    setUploading(null)
    if (upErr) {
      setError(upErr.message)
      return
    }
    await refresh()
    // Tell the parent to re-fetch the booking row so the legacy
    // before_photo_url/after_photo_url columns are up to date. The action
    // buttons (Start work / Mark complete) key off of those.
    onPhotoUploaded?.()
  }

  const handleDelete = async (photo: BookingPhoto) => {
    setError(null)
    setDeleting(true)
    const { error: delErr } = await deleteBookingPhoto(photo.id)
    setDeleting(false)
    setPhotoToDelete(null)
    if (delErr) {
      setError(delErr.message)
      return
    }
    await refresh()
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-500 italic">Loading photos…</div>
    )
  }

  return (
    <div className="space-y-4">
      {services.map((svc) => {
        const addon = svc.key !== 'base' ? selectedAddons.find((a) => a.id === svc.key) : null
        const isBase = svc.key === 'base'
        const icon = addon?.icon || (isBase ? '🌱' : '✨')
        const beforeUploading = uploading === `${svc.key}:before`
        const afterUploading = uploading === `${svc.key}:after`
        const extrasCount = svc.extras.length
        return (
          <div
            key={svc.key}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>{icon}</span>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">
                    {svc.label}
                    {addon && <span className="text-slate-500 font-normal"> · ${addon.price}</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isBase ? 'Required: 1 before + 1 after' : 'Required: 1 before + 1 after'}
                    {extrasCount > 0 && ` · ${extrasCount} extra${extrasCount > 1 ? 's' : ''}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PhotoSlot
                role="before"
                label="Before"
                url={svc.before}
                uploading={beforeUploading}
                onCamera={() => triggerUpload(svc.key, 'before')}
                onGallery={() => triggerGallery(svc.key, 'before')}
                onDelete={svc.beforeRow ? () => setPhotoToDelete(svc.beforeRow!) : undefined}
                onView={svc.before ? () => setSelectedPhoto(svc.before!) : undefined}
              />
              <PhotoSlot
                role="after"
                label="After"
                url={svc.after}
                uploading={afterUploading}
                onCamera={() => triggerUpload(svc.key, 'after')}
                onGallery={() => triggerGallery(svc.key, 'after')}
                onDelete={svc.afterRow ? () => setPhotoToDelete(svc.afterRow!) : undefined}
                onView={svc.after ? () => setSelectedPhoto(svc.after!) : undefined}
              />
            </div>

            {/* Extras (optional context photos) */}
            {svc.extras.length > 0 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {svc.extras.map((p) => (
                  <div
                    key={p.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                    onClick={() => setSelectedPhoto(p.photo_url)}
                  >
                    <img src={p.photo_url} alt="Extra" className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setPhotoToDelete(p) }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                      aria-label="Delete"
                      title="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {svc.extras.length < MAX_EXTRAS_PER_SERVICE && (
                  <button
                    onClick={() => triggerUpload(svc.key, 'during')}
                    disabled={!!uploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-[#22C55E] bg-slate-50 hover:bg-green-50 flex flex-col items-center justify-center text-slate-500 hover:text-[#22C55E] transition-colors"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] font-medium mt-0.5">Extra</span>
                  </button>
                )}
              </div>
            )}
            {svc.extras.length === 0 && (
              <button
                onClick={() => triggerUpload(svc.key, 'during')}
                disabled={!!uploading}
                className="mt-3 w-full text-xs text-slate-500 hover:text-[#16A34A] flex items-center justify-center gap-1 py-2 border border-dashed border-slate-200 hover:border-[#22C55E] rounded-lg hover:bg-green-50 transition-colors"
              >
                <ImagePlus size={12} />
                Add extra context photo (optional)
              </button>
            )}
          </div>
        )
      })}

      {error && (
        <p className="text-sm text-red-600 flex items-start gap-1.5">
          <span className="font-semibold">⚠</span>
          <span>{error}</span>
        </p>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />

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
          <div className="max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Photo"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* In-app delete confirmation modal — replaces native window.confirm()
          which was getting blocked and the user had no feedback. */}
      {photoToDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !deleting && setPhotoToDelete(null)}
        >
          <div
            className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Remove this photo?</h3>
            <p className="text-sm text-slate-600 mb-5">
              The photo will be deleted from the booking. This cannot be undone.
            </p>
            {photoToDelete.photo_url && (
              <img
                src={photoToDelete.photo_url}
                alt="Photo to delete"
                className="w-full h-40 object-cover rounded-lg mb-4 border border-slate-200"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setPhotoToDelete(null)}
                disabled={deleting}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(photoToDelete)}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PhotoSlotProps {
  role: PhotoRole
  label: string
  url?: string
  uploading: boolean
  onCamera: () => void
  onGallery: () => void
  onDelete?: () => void
  onView?: () => void
}

function PhotoSlot({ role, label, url, uploading, onCamera, onGallery, onDelete, onView }: PhotoSlotProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  if (url) {
    return (
      <div className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
        <img
          src={url}
          alt={label}
          className="w-full h-full object-cover cursor-pointer"
          onClick={onView}
        />
        <div className="absolute top-1 left-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              role === 'before' ? 'bg-blue-500 text-white' : 'bg-[#22C55E] text-white'
            }`}
          >
            {label}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
            aria-label="Delete"
            title="Remove photo"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative aspect-square">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        disabled={uploading}
        className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 hover:border-[#22C55E] bg-slate-50 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#22C55E] disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span className="text-xs">Uploading…</span>
          </>
        ) : (
          <>
            <Camera size={20} />
            <span className="text-xs font-medium">Add {label}</span>
          </>
        )}
      </button>

      {menuOpen && !uploading && (
        <div className="absolute z-10 bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
          <button
            onClick={() => { setMenuOpen(false); onCamera() }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-[#16A34A] rounded-lg text-left"
          >
            <Camera size={16} />
            Take photo
          </button>
          <button
            onClick={() => { setMenuOpen(false); onGallery() }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-[#16A34A] rounded-lg text-left"
          >
            <ImagePlus size={16} />
            Choose from device
          </button>
        </div>
      )}

      <div className="absolute top-1 left-1">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            role === 'before' ? 'bg-blue-500/80 text-white' : 'bg-[#22C55E]/80 text-white'
          }`}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
