import { useState, useRef, useEffect } from 'react'
import { Camera, X, Loader2, Image as ImageIcon, Plus } from 'lucide-react'
import type { BookingPhoto, PhotoType } from '../lib/database.types'
import { uploadJobPhoto, getBookingPhotos, deleteBookingPhoto, MAX_PHOTOS_PER_BOOKING } from '../lib/api'

interface JobPhotoGalleryProps {
  bookingId: string
  /** Show the upload UI (pro side) */
  allowUpload?: boolean
  /** Initial photos loaded by parent (saves a fetch) */
  initialPhotos?: BookingPhoto[]
  /** Called whenever photos change */
  onPhotosChange?: (photos: BookingPhoto[]) => void
  /** Compact mode: smaller thumbnails */
  compact?: boolean
}

/**
 * Multi-photo gallery for a booking. Shows up to MAX_PHOTOS_PER_BOOKING
 * (5) photos. Pros can upload additional "during" photos to show
 * different parts of the property.
 */
export default function JobPhotoGallery({
  bookingId,
  allowUpload = false,
  initialPhotos,
  onPhotosChange,
  compact = false,
}: JobPhotoGalleryProps) {
  const [photos, setPhotos] = useState<BookingPhoto[]>(initialPhotos || [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<BookingPhoto | null>(null)

  // Load photos on mount if not provided
  useEffect(() => {
    if (initialPhotos === undefined) {
      loadPhotos()
    }
  }, [bookingId])

  const loadPhotos = async () => {
    const { data } = await getBookingPhotos(bookingId)
    setPhotos(data)
    onPhotosChange?.(data)
  }

  const handleFileSelect = async (file: File) => {
    setError(null)

    if (photos.length >= MAX_PHOTOS_PER_BOOKING) {
      setError(`Maximum ${MAX_PHOTOS_PER_BOOKING} photos allowed per job`)
      return
    }

    setUploading(true)
    const { data, error: uploadError } = await uploadJobPhoto(bookingId, 'during', file)
    setUploading(false)

    if (uploadError) {
      setError(uploadError.message)
      return
    }

    // Reload photos from DB to get the row
    await loadPhotos()
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Remove this photo?')) return
    const { error: delErr } = await deleteBookingPhoto(photoId)
    if (delErr) {
      setError(delErr.message)
      return
    }
    await loadPhotos()
  }

  // Order: before, after, then everything else by upload time
  const orderedPhotos = [...photos].sort((a, b) => {
    const typeOrder: Record<PhotoType, number> = {
      before: 0,
      after: 1,
      completion: 2,
      during: 3,
      issue: 4,
    }
    const aOrder = typeOrder[a.photo_type] ?? 5
    const bOrder = typeOrder[b.photo_type] ?? 5
    if (aOrder !== bOrder) return aOrder - bOrder
    return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
  })

  const canAddMore = allowUpload && photos.length < MAX_PHOTOS_PER_BOOKING

  return (
    <div>
      {/* Gallery grid */}
      {orderedPhotos.length > 0 ? (
        <div className={`grid gap-2 ${compact ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
          {orderedPhotos.map((photo) => {
            const isRequired = photo.photo_type === 'before' || photo.photo_type === 'after'
            return (
              <div
                key={photo.id}
                className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-[#22C55E] transition-colors"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.photo_url}
                  alt={photo.photo_type}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-1 left-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      photo.photo_type === 'before'
                        ? 'bg-blue-500 text-white'
                        : photo.photo_type === 'after'
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-slate-700/80 text-white'
                    }`}
                  >
                    {photo.photo_type === 'before' ? 'Before' : photo.photo_type === 'after' ? 'After' : `#${orderedPhotos.indexOf(photo) + 1}`}
                  </span>
                </div>
                {allowUpload && !isRequired && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(photo.id)
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete photo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )
          })}

          {/* Add photo button (pro side only) */}
          {canAddMore && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-[#22C55E] bg-slate-50 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#22C55E] disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs">Uploading...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span className="text-xs font-medium">Add photo</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : allowUpload ? (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full p-6 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#22C55E] bg-slate-50 hover:bg-green-50 transition-colors flex items-center justify-center gap-2 text-slate-500 hover:text-[#22C55E] disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Uploading...
            </>
          ) : (
            <>
              <Camera size={20} />
              <span className="font-medium">Upload a photo</span>
            </>
          )}
        </button>
      ) : (
        <div className="text-sm text-slate-400 italic">No photos yet</div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = '' // reset so same file can be selected again
        }}
      />

      {/* Counter */}
      {photos.length > 0 && (
        <p className="text-xs text-slate-500 mt-2">
          {photos.length} of {MAX_PHOTOS_PER_BOOKING} photos
          {canAddMore && ' · tap a box to view, hover to delete'}
        </p>
      )}

      {/* Lightbox modal */}
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
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.photo_type}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <div className="text-center text-white mt-2 text-sm">
              {selectedPhoto.photo_type === 'before' ? 'Before' : selectedPhoto.photo_type === 'after' ? 'After' : 'Job photo'} ·
              {' '}{new Date(selectedPhoto.uploaded_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
