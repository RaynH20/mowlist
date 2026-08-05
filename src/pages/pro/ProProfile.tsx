import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  User, Save, Loader2, CheckCircle, Camera, Phone, FileText,
  MapPin, Briefcase, Plus, X, Award, Info, ChevronDown, Lock, Shield, Clock
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { getProviderProfile, updateProviderProfile } from '../../lib/api'
import {
  getProSkills, setProSkill, removeProSkill,
} from '../../lib/proDashboard'
import { supabase } from '../../lib/supabase'

interface ProSkill {
  service_key: string
  years_experience: number
  is_active: boolean
  display_name: string
}

const SERVICE_CATALOG = [
  { key: 'lawn_mowing', name: 'Lawn Mowing', icon: '🌱' },
  { key: 'edging', name: 'Edging', icon: '✂️' },
  { key: 'leaf_blowing', name: 'Leaf Blowing', icon: '🍂' },
  { key: 'hedge_trimming', name: 'Hedge Trimming', icon: '🌳' },
  { key: 'fertilization', name: 'Fertilization', icon: '🌾' },
  { key: 'weed_control', name: 'Weed Control', icon: '🌿' },
  { key: 'aeration', name: 'Lawn Aeration', icon: '💨' },
  { key: 'mulching', name: 'Mulching', icon: '🪴' },
]

export default function ProProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    phone: '',
    service_radius_miles: 10,
    is_available: true,
    profile_image_url: '',
    // Stripe Connect — needed by the StripeConnectSection below
    stripe_connect_account_id: null as string | null,
    stripe_connect_charges_enabled: null as boolean | null,
    stripe_connect_payouts_enabled: null as boolean | null,
    stripe_connect_onboarding_complete: null as boolean | null,
  })
  const [originalProfile, setOriginalProfile] = useState(profile)

  const [skills, setSkills] = useState<ProSkill[]>([])
  const [editingExperience, setEditingExperience] = useState<string | null>(null)
  const [experienceInput, setExperienceInput] = useState('')

  useEffect(() => {
    if (user) fetchAll()
  }, [user])

  const fetchAll = async () => {
    if (!user) return
    setLoading(true)
    try {
      // Provider profile
      const { data: profileData } = await getProviderProfile(user.id)
      if (profileData) {
        setProfile({
          display_name: profileData.display_name || '',
          bio: profileData.bio || '',
          phone: '',
          service_radius_miles: profileData.service_radius_miles || 10,
          is_available: profileData.is_available ?? true,
          profile_image_url: profileData.profile_image_url || '',
          stripe_connect_account_id: profileData.stripe_connect_account_id || null,
          stripe_connect_charges_enabled: profileData.stripe_connect_charges_enabled ?? null,
          stripe_connect_payouts_enabled: profileData.stripe_connect_payouts_enabled ?? null,
          stripe_connect_onboarding_complete: profileData.stripe_connect_onboarding_complete ?? null,
        })
      }

      // User phone (separate table)
      const { data: userData } = await supabase
        .from('users')
        .select('phone')
        .eq('id', user.id)
        .single()
      if (userData?.phone) {
        setProfile((prev) => ({ ...prev, phone: userData.phone || prev.phone }))
      }

      // Skills
      const { data: skillsData } = await getProSkills(user.id)
      setSkills(skillsData || [])
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      // Update provider profile (display name, radius, availability)
      await updateProviderProfile(user.id, {
        display_name: profile.display_name,
        service_radius_miles: profile.service_radius_miles,
        is_available: profile.is_available,
      } as any)

      // Update bio + image (separate update since they aren't in the type)
      await supabase
        .from('provider_profiles')
        .update({
          bio: profile.bio,
          profile_image_url: profile.profile_image_url,
        })
        .eq('user_id', user.id)

      // Update user phone
      if (profile.phone) {
        await supabase.from('users').update({ phone: profile.phone }).eq('id', user.id)
      }

      setOriginalProfile(profile)
      showToast('success', 'Profile saved!')
    } catch (error: any) {
      showToast('error', `Couldn't save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSkill = async (serviceKey: string) => {
    if (!user) return
    const { error } = await setProSkill(user.id, serviceKey, 0)
    if (error) {
      showToast('error', `Couldn't add skill: ${error.message}`)
      return
    }
    const catalog = SERVICE_CATALOG.find(s => s.key === serviceKey)
    setSkills([...skills, {
      service_key: serviceKey,
      years_experience: 0,
      is_active: true,
      display_name: catalog?.name || serviceKey,
    }])
    showToast('success', 'Skill added!')
  }

  const handleRemoveSkill = async (serviceKey: string) => {
    if (!user) return
    const { error } = await removeProSkill(user.id, serviceKey)
    if (error) {
      showToast('error', `Couldn't remove: ${error.message}`)
      return
    }
    setSkills(skills.filter(s => s.service_key !== serviceKey))
    showToast('success', 'Skill removed')
  }

  const handleSaveExperience = async (serviceKey: string) => {
    if (!user) return
    const years = parseInt(experienceInput) || 0
    const { error } = await setProSkill(user.id, serviceKey, years)
    if (error) {
      showToast('error', `Couldn't save: ${error.message}`)
      return
    }
    setSkills(skills.map(s => s.service_key === serviceKey ? { ...s, years_experience: years } : s))
    setEditingExperience(null)
    setExperienceInput('')
    showToast('success', 'Experience updated')
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#22C55E]" />
      </div>
    )
  }

  const skillsAdded = new Set(skills.map(s => s.service_key))
  const availableToAdd = SERVICE_CATALOG.filter(s => !skillsAdded.has(s.key))

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium ${
            toast.type === 'success' ? 'bg-[#22C55E]' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">
          Customers see this when you accept their job. Make it shine.
        </p>
      </div>

      {/* Photo & basic info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#22C55E] to-emerald-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={32} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">{profile.display_name || 'Add your name'}</h2>
            <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt('Enter photo URL (or leave blank to remove):', profile.profile_image_url)
                if (url !== null) setProfile({ ...profile, profile_image_url: url })
              }}
              className="text-sm text-[#22C55E] hover:text-[#16A34A] font-medium mt-1 inline-flex items-center gap-1"
            >
              <Camera size={14} /> {profile.profile_image_url ? 'Change photo' : 'Add photo'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <Field
            label="Display name"
            icon={<User size={16} />}
            value={profile.display_name}
            onChange={(v) => setProfile({ ...profile, display_name: v })}
            placeholder="e.g. Mike's Lawn Care"
          />
          <Field
            label="Phone"
            icon={<Phone size={16} />}
            value={profile.phone}
            onChange={(v) => setProfile({ ...profile, phone: v })}
            placeholder="(555) 555-5555"
            type="tel"
          />

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <FileText size={14} /> Bio
            </label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              maxLength={500}
              placeholder="Tell customers about yourself, your experience, and what makes you great at what you do…"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              {profile.bio.length}/500
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
              <MapPin size={14} /> Service radius (miles)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="50"
                value={profile.service_radius_miles}
                onChange={(e) => setProfile({ ...profile, service_radius_miles: parseInt(e.target.value) })}
                className="flex-1 accent-[#22C55E]"
              />
              <span className="text-sm font-semibold text-slate-900 w-12 text-right">
                {profile.service_radius_miles} mi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              How far you'll travel for jobs
            </p>
          </div>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900">Available for new jobs</p>
              <p className="text-xs text-slate-500">Pause to hide jobs temporarily</p>
            </div>
            <input
              type="checkbox"
              checked={profile.is_available}
              onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })}
              className="w-5 h-5 accent-[#22C55E]"
            />
          </label>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-5 bg-[#22C55E] text-white py-3 rounded-xl font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save profile
          </button>
        )}
      </div>

      {/* Skills & services */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Briefcase size={18} /> Services you offer
          </h2>
          <span className="text-xs text-slate-500">{skills.length} active</span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Add the services you're skilled at. Customers search by service.
        </p>

        {skills.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg mb-4">
            <Award size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500">No services added yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first service below</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {skills.map((skill) => {
              const catalog = SERVICE_CATALOG.find(s => s.key === skill.service_key)
              return (
                <div
                  key={skill.service_key}
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg"
                >
                  <span className="text-2xl flex-shrink-0">{catalog?.icon || '✅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{skill.display_name}</p>
                    {editingExperience === skill.service_key ? (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={experienceInput}
                          onChange={(e) => setExperienceInput(e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-slate-200 rounded"
                          autoFocus
                        />
                        <span className="text-xs text-slate-500">years</span>
                        <button
                          onClick={() => handleSaveExperience(skill.service_key)}
                          className="text-xs text-[#22C55E] font-semibold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingExperience(null)
                            setExperienceInput('')
                          }}
                          className="text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingExperience(skill.service_key)
                          setExperienceInput(String(skill.years_experience || 0))
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        {skill.years_experience > 0
                          ? `${skill.years_experience} year${skill.years_experience === 1 ? '' : 's'} experience`
                          : 'Tap to add experience'}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSkill(skill.service_key)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add skill */}
        {availableToAdd.length > 0 && (
          <details className="border border-slate-200 rounded-lg">
            <summary className="cursor-pointer p-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 list-none">
              <Plus size={16} /> Add a service
            </summary>
            <div className="grid grid-cols-2 gap-2 p-3 border-t border-slate-200">
              {availableToAdd.map((svc) => (
                <button
                  key={svc.key}
                  onClick={() => handleAddSkill(svc.key)}
                  className="flex items-center gap-2 p-2 text-left border border-slate-200 rounded-lg hover:border-[#22C55E] hover:bg-green-50 transition-colors"
                >
                  <span className="text-xl flex-shrink-0">{svc.icon}</span>
                  <span className="text-sm font-medium text-slate-700 truncate">{svc.name}</span>
                </button>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* Stripe Connect - Verification & Payouts */}
      <StripeConnectSection
        connectAccountId={profile.stripe_connect_account_id}
        chargesEnabled={profile.stripe_connect_charges_enabled}
        payoutsEnabled={profile.stripe_connect_payouts_enabled}
        onboardingComplete={profile.stripe_connect_onboarding_complete}
        onUpdate={fetchAll}
      />
    </div>
  )
}

function Field({
  label, icon, value, onChange, placeholder, type = 'text',
}: {
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
      />
    </div>
  )
}

function ChecklistRow({ label, done, pending }: { label: string; done?: boolean; pending?: string }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
      <span className="text-sm text-slate-700">{label}</span>
      {done ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
          <CheckCircle size={14} /> Verified
        </span>
      ) : (
        <span className="text-xs text-slate-500">{pending || 'Pending'}</span>
      )}
    </div>
  )
}


function StripeConnectSection({
  connectAccountId,
  chargesEnabled,
  payoutsEnabled,
  onboardingComplete,
  onUpdate,
}: {
  connectAccountId: string | null
  chargesEnabled: boolean | null
  payoutsEnabled: boolean | null
  onboardingComplete: boolean | null
  onUpdate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const location = useLocation()

  // Check URL params for connection success
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('connected') === 'true') {
      onUpdate()
      // Clean URL
      window.history.replaceState({}, '', '/pro/profile')
    }
  }, [location.search])

  const handleConnect = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { startConnectOnboarding } = await import('../../lib/stripeConnect')
      const result = await startConnectOnboarding(user.id, user.email || '')
      // Redirect to Stripe onboarding
      window.location.href = result.onboardingUrl
    } catch (err: any) {
      setError(err.message || 'Failed to start Stripe onboarding')
      setLoading(false)
    }
  }

  const isFullyOnboarded = chargesEnabled && payoutsEnabled && onboardingComplete

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <h2 className="font-semibold text-slate-900 mb-3">Verification & Payouts</h2>
      <p className="text-sm text-slate-500 mb-4">
        {isFullyOnboarded
          ? 'You\'re fully verified and ready to receive payouts.'
          : 'Connect with Stripe to verify your identity and start receiving payouts.'}
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        <ChecklistRow label="Email confirmed" done />
        <ChecklistRow label="Identity verified" done={!!chargesEnabled} />
        <ChecklistRow label="Background check" done={!!onboardingComplete} />
        <ChecklistRow
          label="Bank account connected"
          done={!!payoutsEnabled}
          pending={connectAccountId && !payoutsEnabled ? 'Pending Stripe verification' : undefined}
        />
      </div>

      {!isFullyOnboarded ? (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full bg-[#22C55E] text-white py-3 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              {connectAccountId ? 'Continue Stripe setup' : 'Connect with Stripe'}
            </>
          )}
        </button>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Ready to receive payouts. Earnings are sent weekly.</span>
        </div>
      )}

      {/* What to expect — explains the Stripe redirect so pros aren't surprised.
          Always visible (collapsed for verified pros) so they can reference
          the explainer anytime, and open by default for new pros who need it. */}
      <div className="mt-5 border-t border-slate-100 pt-5">
        <details className="group" open={!isFullyOnboarded}>
          <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
            <span className="flex items-center gap-2">
              <Info size={16} className="text-slate-400" />
              How payouts work
            </span>
            <ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            {/* The 3 steps */}
            <div className="space-y-3">
              <Step
                num={1}
                title="You'll be sent to Stripe"
                desc="MowList uses Stripe to handle payments and identity verification. The button opens Stripe's secure site in this same tab."
              />
              <Step
                num={2}
                title="Enter your info on Stripe's site"
                desc="Takes about 3–5 minutes. You'll need: your bank account & routing number, the last 4 digits of your SSN, and your home address."
              />
              <Step
                num={3}
                title="Come back here and start earning"
                desc="Stripe sends you back to MowList automatically when you're done. We'll email you when money hits your bank."
              />
            </div>

            {/* Why Stripe? */}
            <div className="bg-slate-50 rounded-lg p-4 mt-4 space-y-2">
              <p className="font-medium text-slate-900">Why Stripe?</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li className="flex gap-2"><Lock size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />MowList never sees your bank account — Stripe keeps it encrypted and secure.</li>
                <li className="flex gap-2"><FileText size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />Your 1099 tax form is generated automatically — no paperwork.</li>
                <li className="flex gap-2"><Shield size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />Stripe verifies your identity, which protects customers and you.</li>
                <li className="flex gap-2"><Clock size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />Payouts arrive in your bank on a 2-day rolling basis (daily after a few weeks).</li>
              </ul>
            </div>

            {/* Need help link */}
            <div className="text-xs text-slate-500 pt-2">
              Questions?{' '}
              <Link to="/contact" className="text-[#22C55E] hover:underline font-medium">
                Contact us
              </Link>
              {' '}or check Stripe's{' '}
              <a
                href="https://support.stripe.com/topics/connect-onboarding"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22C55E] hover:underline font-medium"
              >
                Connect onboarding guide
              </a>.
            </div>
          </div>
        </details>
      </div>

      <p className="text-xs text-slate-500 mt-3">
        Stripe handles your bank info, tax forms (1099s), and identity verification. MowList never sees your bank account.
      </p>
    </div>
  )
}

// Small step component for the "What to expect" explainer
function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        {num}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}
