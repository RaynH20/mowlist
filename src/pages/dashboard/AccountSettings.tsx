import { useEffect, useState } from 'react'
import { User, Mail, Phone, Home, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import type { Address } from '../../lib/database.types'

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
  const { user } = useAuth()
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

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      // Update customer_profiles (first/last name)
      const { error: profileError } = await supabase
        .from('customer_profiles')
        .update({
          first_name: formData.firstName || null,
          last_name: formData.lastName || null,
        })
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
      </div>
    </div>
  )
}
