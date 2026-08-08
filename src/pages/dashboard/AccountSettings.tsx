import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Home, Save, Loader2, AlertCircle, CheckCircle, LogOut, Camera, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import type { Address } from '../../lib/database.types'

// Preset avatars customers can pick from (no upload needed)
const PRESET_AVATARS = [
  { id: 'house-1', emoji: '🏡', label: 'House' },
  { id: 'tree-1', emoji: '🌳', label: 'Tree' },
  { id: 'flower-1', emoji: '🌸', label: 'Flower' },
  { id: 'sun-1', emoji: '☀️', label: 'Sun' },
  { id: 'mountain-1', emoji: '⛰️', label: 'Mountain' },
  { id: 'beach-1', emoji: '🏖️', label: 'Beach' },
  { id: 'cactus-1', emoji: '🌵', label: 'Cactus' },
  { id: 'leaf-1', emoji: '🍃', label: 'Leaf' },
  { id: 'dog-1', emoji: '🐕', label: 'Dog' },
  { id: 'cat-1', emoji: '🐈', label: 'Cat' },
  { id: 'balloon-1', emoji: '🎈', label: 'Balloon' },
  { id: 'star-1', emoji: '⭐', label: 'Star' },
]

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
}

export default function AccountSettings() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    if (!confirm('Sign out of MowList?')) return
    await signOut()
    navigate('/', { replace: true })
  }
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarSource, setAvatarSource] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addressId, setAddressId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Load profile
        const { data: profile } = await supabase
          .from('customer_profiles')
          .select('first_name, last_name, default_address_id')
          .eq('user_id', user.id)
          .single()

        // Load user (for phone + email)
        const { data: userData } = await supabase
          .from('users')
          .select('phone, email')
          .eq('id', user.id)
          .single()

        // Load default address if set
        let defaultAddress: Address | null = null
        if (profile?.default_address_id) {
          const { data: addr } = await supabase
            .from('addresses')
            .select('*')
            .eq('id', profile.default_address_id)
            .single()
          defaultAddress = addr
        }

        if (cancelled) return

        setFormData({
          firstName: profile?.first_name || '',
          lastName: profile?.last_name || '',
          email: userData?.email || user.email || '',
          phone: userData?.phone || '',
          address: defaultAddress?.street_1 || '',
          city: defaultAddress?.city || '',
          state: defaultAddress?.state || '',
          zipCode: defaultAddress?.zip_code || '',
        })
        setAddressId(defaultAddress?.id || null)
        setAvatarUrl((profile as any)?.avatar_url || null)
        setAvatarSource((profile as any)?.avatar_source || null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, or GIF).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please pick one under 5MB.')
      return
    }
    setUploadingAvatar(true)
    setError(null)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `avatars/${user.id}/avatar-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('job-photos')
        .upload(filePath, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('job-photos').getPublicUrl(filePath)
      setAvatarUrl(pub.publicUrl)
      setAvatarSource('uploaded')
      setShowAvatarPicker(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePresetAvatar = (preset: { id: string; emoji: string }) => {
    // Store as a data URL so it persists (no storage roundtrip needed)
    setAvatarUrl(`preset:${preset.id}`)
    setAvatarSource('preset')
    setShowAvatarPicker(false)
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(null)
    setAvatarSource(null)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      // Update customer_profiles (first/last name + avatar)
      const { error: profileError } = await supabase
        .from('customer_profiles')
        .update({
          first_name: formData.firstName || null,
          last_name: formData.lastName || null,
          avatar_url: avatarUrl,
          avatar_source: avatarSource,
        } as any)
        .eq('user_id', user.id)

      if (profileError) throw profileError

      // Update user phone
      const { error: userError } = await supabase
        .from('users')
        .update({ phone: formData.phone || null })
        .eq('id', user.id)

      if (userError) throw userError

      // Update or create address
      if (formData.address && formData.city) {
        if (addressId) {
          const { error: addrError } = await supabase
            .from('addresses')
            .update({
              street_1: formData.address,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zipCode,
            })
            .eq('id', addressId)
          if (addrError) throw addrError
        } else {
          const { data: newAddr, error: addrError } = await supabase
            .from('addresses')
            .insert({
              user_id: user.id,
              street_1: formData.address,
              city: formData.city,
              state: formData.state,
              zip_code: formData.zipCode,
              country: 'USA',
            })
            .select()
            .single()
          if (addrError) throw addrError
          if (newAddr) {
            setAddressId(newAddr.id)
            // Link as default
            await supabase
              .from('customer_profiles')
              .update({ default_address_id: newAddr.id })
              .eq('user_id', user.id)
          }
        }
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#22C55E]" size={32} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-4">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-green-800 text-sm font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Profile Information</h2>

        {/* Profile photo / avatar */}
        <div className="mb-6 pb-6 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-700 mb-3">Your photo</p>
          <p className="text-xs text-slate-500 mb-3">
            Helps pros and neighbors recognize you. Use a real photo, or pick a fun icon.
          </p>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl && avatarUrl.startsWith('preset:') ? (
                (() => {
                  const preset = PRESET_AVATARS.find(p => `preset:${p.id}` === avatarUrl)
                  return (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#22C55E] to-[#1E40AF] flex items-center justify-center text-3xl">
                      {preset?.emoji || '👤'}
                    </div>
                  )
                })()
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Your profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#22C55E] to-[#1E40AF] text-white font-bold text-2xl flex items-center justify-center">
                  {(formData.firstName?.[0] || formData.email?.[0] || '?').toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-7 h-7 bg-[#22C55E] text-white rounded-full flex items-center justify-center hover:bg-[#16A34A] transition-colors shadow-md disabled:opacity-50"
                title="Upload photo"
              >
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  <Upload size={14} />
                  Upload
                </button>
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  <ImageIcon size={14} />
                  Pick icon
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <X size={14} />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Preset icon picker */}
          {showAvatarPicker && (
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-medium text-slate-700 mb-2">Choose an icon</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetAvatar(preset)}
                    className="aspect-square bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center text-2xl hover:border-[#22C55E] hover:bg-green-50 transition-colors"
                    title={preset.label}
                  >
                    {preset.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Email changes require contacting support</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="pt-2 border-t">
            <h3 className="text-md font-semibold text-slate-900 mb-4 mt-4">Default Address</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Street Address</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ZIP</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 bg-[#22C55E] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#16A34A] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Sign Out */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign out</h2>
          <p className="text-sm text-slate-500 mb-4">
            Sign out of your MowList account on this device.
          </p>
          <button
            onClick={handleSignOut}
            className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
