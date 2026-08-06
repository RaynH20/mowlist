import { useState, useRef, useEffect } from 'react'
import { Camera, X, Loader2, Image as ImageIcon, Plus, ImagePlus, AlertTriangle } from 'lucide-react'
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
  /** When true, force freshness check (block photos older than 30 min) */
  requireFreshPhoto?: boolean
  /** Whether to show a "report" button on each photo (customer side) */
  showReportButton?: boolean
}

const PHOTO_MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes
const MIN_WIDTH = 320
const MIN_HEIGHT = 240
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface ValidationError {
  code: 'too_old' | 'too_small' | 'wrong_type' | 'too_large' | 'no_exif'
  message: string
}

/**
 * Try to read EXIF DateTimeOriginal from a photo to verify it was
 * taken recently. Most modern phone cameras include this in JPEGs.
 * Returns null if no EXIF data is present.
 */
async function getExifTakenAt(file: File): Promise<Date | null> {
  try {
    // Only JPEG files reliably carry EXIF
    if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') return null

    const buffer = await file.slice(0, 128 * 1024).arrayBuffer()
    const view = new DataView(buffer)
    // Look for "Exif\0\0" marker (0x45786966)
    let exifOffset = -1
    for (let i = 0; i < view.byteLength - 6; i++) {
      if (
        view.getUint8(i) === 0x45 &&
        view.getUint8(i + 1) === 0x78 &&
        view.getUint8(i + 2) === 0x69 &&
        view.getUint8(i + 3) === 0x66
      ) {
        exifOffset = i + 6 // skip "Exif\0\0"
        break
      }
    }
    if (exifOffset < 0) return null

    // Skip the TIFF header (8 bytes: II/MM + 0x002A + offset)
    const littleEndian = view.getUint8(exifOffset) === 0x49 // 'II' = little-endian
    const ifdOffset = exifOffset + view.getUint32(exifOffset + 4, littleEndian)
    const numEntries = view.getUint16(ifdOffset, littleEndian)

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifdOffset + 2 + i * 12
      const tag = view.getUint16(entryOffset, littleEndian)
      // 0x9003 = DateTimeOriginal
      if (tag === 0x9003) {
        const valueOffset = exifOffset + view.getUint32(entryOffset + 8, littleEndian)
        // Format: "YYYY:MM:DD HH:MM:SS"
        const dateStr = String.fromCharCode(...new Uint8Array(buffer, valueOffset, 19))
        return new Date(dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'))
      }
    }
    return null
  } catch {
    return null
  }
}

function validatePhoto(
  file: File,
  requireFresh: boolean
): Promise<ValidationError | null> {
  return new Promise(async (resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ code: 'wrong_type', message: 'Please upload an image file' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      resolve({ code: 'too_large', message: 'Image must be under 10MB' })
      return
    }

    // Read image dimensions
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(url)
      if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
        resolve({
          code: 'too_small',
          message: `Image is too small (${img.width}×${img.height}). Minimum is ${MIN_WIDTH}×${MIN_HEIGHT}.`,
        })
        return
      }

      // Freshness check (if required)
      if (requireFresh) {
        const takenAt = await getExifTakenAt(file)
        if (takenAt) {
          const ageMs = Date.now() - takenAt.getTime()
          if (ageMs > PHOTO_MAX_AGE_MS) {
            const mins = Math.round(ageMs / 60000)
            resolve({
              code: 'too_old',
              message: `This photo is ${mins} minutes old. Please take a fresh photo right now.`,
            })
            return
          }
        }
        // If no EXIF (e.g., screenshot or PNG), we don't block — just note it
        // Real production should require EXIF
      }

      resolve(null)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ code: 'wrong_type', message: 'Could not read image file' })
    }
    img.src = url
  })
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
  requireFreshPhoto = false,
  showReportButton = false,
}: JobPhotoGalleryProps) {
  const [photos, setPhotos] = useState<BookingPhoto[]>(initialPhotos || [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUploadOptions, setShowUploadOptions] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<BookingPhoto | null>(null)
  const [reportedPhotos, setReportedPhotos] = useState<Set<string>>(new Set())

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
    setShowUploadOptions(false)

    if (photos.length >= MAX_PHOTOS_PER_BOOKING) {
      setError(`Maximum ${MAX_PHOTOS_PER_BOOKING} photos allowed per job`)
      return
    }

    // Validate
    const validationError = await validatePhoto(file, requireFreshPhoto)
    if (validationError) {
      setError(validationError.message)
      return
    }

    setUploading(true)
    const { error: uploadError } = await uploadJobPhoto(bookingId, 'during', file)
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

  const handleReport = async (photo: BookingPhoto) => {
    const reason = prompt(
      'Why are you reporting this photo? (inappropriate, off-topic, etc.)',
      ''
    )
    if (!reason) return

    // Save the report locally and show confirmation
    setReportedPhotos(prev => new Set(prev).add(photo.id))
    setError(null)

    // In production, this would call an API to flag the photo
    // For now, log it and show a confirmation
    console.warn('[PhotoReport]', { photoId: photo.id, bookingId, reason, reportedAt: new Date().toISOString() })

    // Show a brief success state
    setTimeout(() => {
      alert('Thanks — we\'ll review this photo.')
    }, 100)
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
            const isReported = reportedPhotos.has(photo.id)
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
                {showReportButton && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReport(photo)
                    }}
                    disabled={isReported}
                    className={`absolute bottom-1 right-1 text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      isReported
                        ? 'bg-slate-200 text-slate-500'
                        : 'bg-amber-500 text-white hover:bg-amber-600'
                    }`}
                    aria-label="Report photo"
                  >
                    {isReported ? 'Reported' : 'Report'}
                  </button>
                )}
              </div>
            )
          })}

          {/* Add photo button (pro side only) — opens upload options */}
          {canAddMore && (
            <div className="aspect-square relative">
              <button
                onClick={() => setShowUploadOptions(!showUploadOptions)}
                disabled={uploading}
                className="w-full h-full rounded-lg border-2 border-dashed border-slate-300 hover:border-[#22C55E] bg-slate-50 hover:bg-green-50 transition-colors flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#22C55E] disabled:opacity-50"
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

              {/* Upload options popover */}
              {showUploadOptions && !uploading && (
                <div className="absolute z-10 bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-[#16A34A] rounded-lg text-left"
                  >
                    <Camera size={16} />
                    Take photo
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-green-50 hover:text-[#16A34A] rounded-lg text-left"
                  >
                    <ImagePlus size={16} />
                    Choose from gallery
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : allowUpload ? (
        <div className="relative">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="p-6 rounded-xl border-2 border-[#22C55E] bg-green-50 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-2 text-[#16A34A] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={28} />}
              <span className="font-semibold text-sm">Take photo</span>
              <span className="text-xs text-green-700">Use your camera</span>
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="p-6 rounded-xl border-2 border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-2 text-slate-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <ImagePlus size={28} />}
              <span className="font-semibold text-sm">Upload</span>
              <span className="text-xs text-slate-500">Choose from device</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-400 italic">No photos yet</div>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2 flex items-start gap-1.5">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Camera input — uses back camera on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />
      {/* Gallery input — any image from device */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
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
