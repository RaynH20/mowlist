import { useState } from 'react'
import { MapPin, Plus, X, Search, ToggleLeft, ToggleRight, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react'

interface ServiceZone {
  id: number
  city: string
  zipCode: string
  radius: number
  active: boolean
  jobCount: number
}

export default function ProArea() {
  const [zones, setZones] = useState<ServiceZone[]>([
    { id: 1, city: 'Austin', zipCode: '78701', radius: 15, active: true, jobCount: 45 },
    { id: 2, city: 'Round Rock', zipCode: '78664', radius: 10, active: true, jobCount: 12 },
    { id: 3, city: 'Cedar Park', zipCode: '78613', radius: 8, active: false, jobCount: 0 },
    { id: 4, city: 'Pflugerville', zipCode: '78660', radius: 12, active: false, jobCount: 0 },
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newZip, setNewZip] = useState('')
  const [newRadius, setNewRadius] = useState(10)

  const toggleZone = (id: number) => {
    setZones(zones.map(zone =>
      zone.id === id ? { ...zone, active: !zone.active } : zone
    ))
  }

  const deleteZone = (id: number) => {
    setZones(zones.filter(zone => zone.id !== id))
  }

  const addZone = () => {
    if (newCity && newZip) {
      setZones([...zones, {
        id: Date.now(),
        city: newCity,
        zipCode: newZip,
        radius: newRadius,
        active: true,
        jobCount: 0
      }])
      setNewCity('')
      setNewZip('')
      setNewRadius(10)
      setShowAddModal(false)
    }
  }

  const activeZones = zones.filter(z => z.active)
  const totalJobs = zones.reduce((sum, z) => sum + z.jobCount, 0)

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Service Area</h1>
        <p className="text-slate-500 mt-1">Manage the areas where you accept jobs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-2xl font-bold text-slate-900">{activeZones.length}</div>
          <div className="text-xs text-slate-500">Active Zones</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-2xl font-bold text-slate-900">{totalJobs}</div>
          <div className="text-xs text-slate-500">Total Jobs</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="text-2xl font-bold text-slate-900">{zones.length}</div>
          <div className="text-xs text-slate-500">All Zones</div>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Coverage Map</h2>
        <div className="bg-slate-100 rounded-lg h-64 flex items-center justify-center relative overflow-hidden">
          {/* Decorative map-like pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="text-center relative z-10">
            <MapPin className="text-[#22C55E] mx-auto mb-2" size={32} />
            <p className="text-slate-500 text-sm">Interactive map view coming soon</p>
            <p className="text-slate-400 text-xs mt-1">Your service zones are highlighted below</p>
          </div>

          {/* Zone indicators */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 border-2 border-[#22C55E] rounded-full opacity-50 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Service Zones */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Service Zones</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#22C55E] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#16A34A] transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Add Zone
          </button>
        </div>

        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`p-4 rounded-lg border-2 transition-colors ${
                zone.active
                  ? 'border-[#22C55E] bg-green-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    zone.active ? 'bg-[#22C55E]' : 'bg-slate-300'
                  }`}>
                    <MapPin size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{zone.city}, TX {zone.zipCode}</div>
                    <div className="text-sm text-slate-500">
                      {zone.radius} mile radius • {zone.jobCount} jobs
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleZone(zone.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      zone.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {zone.active ? (
                      <>
                        <ToggleRight size={16} /> Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={16} /> Inactive
                      </>
                    )}
                  </button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteZone(zone.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {zones.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="text-slate-300 mx-auto mb-3" size={40} />
            <p className="text-slate-500">No service zones added yet</p>
            <p className="text-sm text-slate-400">Add your first service area to start receiving jobs</p>
          </div>
        )}
      </div>

      {/* Add Zone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Add Service Zone</h3>
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="e.g., Austin"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ZIP Code</label>
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
                  min="5"
                  max="30"
                  value={newRadius}
                  onChange={(e) => setNewRadius(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>5 miles</span>
                  <span>30 miles</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addZone}
                className="flex-1 px-4 py-3 bg-[#22C55E] text-white rounded-lg font-medium hover:bg-[#16A34A] transition-colors"
              >
                Add Zone
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
