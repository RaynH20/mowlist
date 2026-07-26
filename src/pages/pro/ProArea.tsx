import { useState, useEffect } from 'react'
import {
  MapPin, Plus, X, ToggleLeft, ToggleRight, Trash2,
  CheckCircle, AlertCircle, Loader2, Edit2, Star
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import {
  getProviderServiceAreas,
  addServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from '../../lib/api'

interface ServiceArea {
  id: string
  provider_id: string
  city: string
  state: string
  zip_code: string | null
  radius_miles: number | null
  is_active: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

export default function ProArea() {
  const { user } = useAuth()
  const [zones, setZones] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingZone, setEditingZone] = useState<ServiceArea | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('TX')
  const [newZip, setNewZip] = useState('')
  const [newRadius, setNewRadius] = useState(10)
  const [newIsPrimary, setNewIsPrimary] = useState(false)

  useEffect(() => {
    if (user) fetchZones()
  }, [user])

  const fetchZones = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await getProviderServiceAreas(user.id)
      if (error) console.error('Error loading zones:', error)
      setZones(data || [])
    } catch (error) {
      console.error('Error fetching zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const toggleZone = async (zone: ServiceArea) => {
    const { data, error } = await updateServiceArea(zone.id, { is_active: !zone.is_active })
    if (error) {
      showToast('error', `Couldn't update: ${error.message}`)
      return
    }
    setZones(zones.map(z => z.id === zone.id ? { ...z, is_active: !zone.is_active } : z))
    showToast('success', zone.is_active ? 'Zone paused' : 'Zone activated')
  }

  const removeZone = async (id: string) => {
    if (!confirm('Delete this service zone?')) return
    const { error } = await deleteServiceArea(id)
    if (error) {
      showToast('error', `Couldn't delete: ${error.message}`)
      return
    }
    setZones(zones.filter(z => z.id !== id))
    showToast('success', 'Zone deleted')
  }

  const openAddModal = () => {
    setEditingZone(null)
    setNewCity('')
    setNewState('TX')
    setNewZip('')
    setNewRadius(10)
    setNewIsPrimary(zones.length === 0)
    setShowAddModal(true)
  }

  const openEditModal = (zone: ServiceArea) => {
    setEditingZone(zone)
    setNewCity(zone.city)
    setNewState(zone.state)
    setNewZip(zone.zip_code || '')
    setNewRadius(zone.radius_miles || 10)
    setNewIsPrimary(zone.is_primary)
    setShowAddModal(true)
  }

  const saveZone = async () => {
    if (!newCity.trim() || !newState.trim()) {
      showToast('error', 'City and state are required')
      return
    }
    setSaving(true)
    try {
      if (editingZone) {
        // Update
        const { data, error } = await updateServiceArea(editingZone.id, {
          city: newCity.trim(),
          state: newState.trim().toUpperCase(),
          zip_code: newZip.trim() || null,
          radius_miles: newRadius,
          is_primary: newIsPrimary,
        })
        if (error) throw error
        setZones(zones.map(z => z.id === editingZone.id ? data! : z))
        showToast('success', 'Zone updated')
      } else {
        // Create
        const { data, error } = await addServiceArea(user!.id, {
          city: newCity.trim(),
          state: newState.trim().toUpperCase(),
          zip_code: newZip.trim() || null,
          radius_miles: newRadius,
          is_active: true,
          is_primary: newIsPrimary,
        } as any)
        if (error) throw error
        setZones([data!, ...zones])
        showToast('success', 'Zone added')
      }
      setShowAddModal(false)
    } catch (error: any) {
      showToast('error', `Couldn't save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const activeZones = zones.filter(z => z.is_active)

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-[#22C55E]" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
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
        <h1 className="text-2xl font-bold text-slate-900">Service Area</h1>
        <p className="text-slate-500 mt-1">
          Manage the areas where you accept jobs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-2xl font-bold text-slate-900">{activeZones.length}</div>
          <div className="text-xs text-slate-500">Active Zones</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-2xl font-bold text-slate-900">{zones.length - activeZones.length}</div>
          <div className="text-xs text-slate-500">Paused</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-2xl font-bold text-slate-900">
            {Math.max(...zones.map(z => z.radius_miles || 0), 0)}
          </div>
          <div className="text-xs text-slate-500">Max radius (mi)</div>
        </div>
      </div>

      {/* Service Zones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Service Zones</h2>
          <button
            onClick={openAddModal}
            className="bg-[#22C55E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Add Zone
          </button>
        </div>

        {zones.length === 0 ? (
          <div className="text-center py-10">
            <MapPin className="text-slate-300 mx-auto mb-3" size={40} />
            <p className="text-slate-500 font-medium">No service zones yet</p>
            <p className="text-sm text-slate-400 mt-1">Add your first area to start receiving jobs</p>
            <button
              onClick={openAddModal}
              className="mt-4 bg-[#22C55E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} /> Add your first zone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div
                key={zone.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  zone.is_active
                    ? 'border-[#22C55E] bg-green-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      zone.is_active ? 'bg-[#22C55E]' : 'bg-slate-300'
                    }`}>
                      <MapPin size={18} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span className="truncate">{zone.city}, {zone.state}</span>
                        {zone.is_primary && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                            <Star size={10} /> Primary
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {zone.zip_code ? `${zone.zip_code} · ` : ''}
                        {zone.radius_miles || 10} mile radius
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleZone(zone)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        zone.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {zone.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {zone.is_active ? 'Active' : 'Paused'}
                    </button>
                    <button
                      onClick={() => openEditModal(zone)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => removeZone(zone.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingZone ? 'Edit Service Zone' : 'Add Service Zone'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g., Austin"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                <select
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                >
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code (optional)</label>
                <input
                  type="text"
                  value={newZip}
                  onChange={(e) => setNewZip(e.target.value)}
                  placeholder="e.g., 78701"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Service Radius: {newRadius} miles
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={newRadius}
                  onChange={(e) => setNewRadius(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 mile</span>
                  <span>50 miles</span>
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsPrimary}
                  onChange={(e) => setNewIsPrimary(e.target.checked)}
                  className="w-4 h-4 accent-[#22C55E]"
                />
                <span className="text-sm text-slate-700">Mark as primary service area</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveZone}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-[#22C55E] text-white rounded-lg font-medium hover:bg-[#16A34A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                {editingZone ? 'Save' : 'Add Zone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-medium text-blue-900">Tips for Service Areas</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• Start with a smaller radius to build up reviews faster</li>
              <li>• Add neighboring cities to increase your job opportunities</li>
              <li>• Toggle zones inactive during vacations to pause new jobs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
