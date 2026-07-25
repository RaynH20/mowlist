import { useState } from 'react'
import { User, Star, CheckCircle, AlertCircle, MapPin, DollarSign, CreditCard, Shield, Settings, Bell, Phone, Mail, Clock, Wrench, Car, Calendar, Edit2, Plus, X, ChevronRight } from 'lucide-react'

export default function ProProfile() {
  const [profile, setProfile] = useState({
    name: 'Mike Thompson',
    email: 'mike@example.com',
    phone: '(512) 555-0123',
    bio: 'Professional lawn care with 5+ years experience. Specializing in residential properties and small commercial lots. Fast, reliable, and thorough service.',
    rating: 4.9,
    reviews: 127,
    completedJobs: 245,
    serviceArea: '15 miles from Austin, TX',
    serviceRadius: 15,
    serviceCities: ['Austin', 'Round Rock', 'Cedar Park', 'Pflugerville'],
    isVerified: true,
    payoutMethod: 'Bank Transfer',
    payoutEmail: 'mike@email.com',
    yearsExperience: 5,
    responseTime: '< 1 hour',
    equipmentType: 'Commercial',
    services: ['Lawn Mowing', 'Edging', 'Leaf Removal', 'Trimming'],
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
  })

  const [activeTab, setActiveTab] = useState('overview')

  const onboardingSteps = [
    { id: 1, title: 'Profile Setup', description: 'Basic info and photo', completed: true },
    { id: 2, title: 'Service Area', description: 'Set your working radius', completed: true },
    { id: 3, title: 'Services Offered', description: 'Select services you provide', completed: true },
    { id: 4, title: 'Payout Details', description: 'Connect payment method', completed: true },
    { id: 5, title: 'Verification', description: 'ID and background check', completed: true },
  ]

  const verificationItems = [
    { id: 'identity', title: 'Identity Verification', status: 'verified', icon: Shield },
    { id: 'background', title: 'Background Check', status: 'verified', icon: CheckCircle },
    { id: 'insurance', title: 'Insurance', status: 'verified', icon: CheckCircle },
    { id: 'vehicle', title: 'Vehicle', status: 'pending', icon: Car },
  ]

  const availableServices = [
    'Lawn Mowing',
    'Edging',
    'Leaf Removal',
    'Trimming',
    'Aeration',
    'Fertilization',
    'Weed Control',
    'Bush/Hedge Trimming',
    'Tree Trimming',
    'Mulching',
  ]

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1)

  return (
    <div className="p-4 md:p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-3xl font-bold">{profile.name.charAt(0)}</span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#16A34A] transition-colors">
              <Edit2 size={14} />
            </button>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{profile.bio}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Star className="text-yellow-500 fill-current" size={16} />
              <span className="font-semibold">{profile.rating}</span>
              <span className="text-slate-500">({profile.reviews} reviews)</span>
            </div>
          </div>
          {profile.isVerified && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
              <CheckCircle className="text-[#22C55E]" size={18} />
              <span className="text-green-700 font-medium text-sm">Verified Pro</span>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{profile.completedJobs}</div>
            <div className="text-xs text-slate-500">Jobs Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{profile.rating}</div>
            <div className="text-xs text-slate-500">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{profile.yearsExperience}+</div>
            <div className="text-xs text-slate-500">Years Experience</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'services', label: 'Services' },
          { id: 'availability', label: 'Availability' },
          { id: 'settings', label: 'Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#22C55E] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Onboarding Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Onboarding Progress</h3>
            <div className="space-y-3">
              {onboardingSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-green-100' : 'bg-slate-100'
                  }`}>
                    {step.completed ? (
                      <CheckCircle size={16} className="text-[#22C55E]" />
                    ) : (
                      <span className="text-slate-400 text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${step.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-slate-500">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Verification Status</h3>
            <div className="space-y-3">
              {verificationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <item.icon size={20} className={item.status === 'verified' ? 'text-green-600' : 'text-yellow-600'} />
                    <span className="font-medium text-slate-900">{item.title}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.status === 'verified' ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Area & Payout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="text-[#22C55E]" size={20} />
                <h3 className="font-semibold text-slate-900">Service Area</h3>
              </div>
              <p className="text-slate-600 mb-2">{profile.serviceArea}</p>
              <p className="text-sm text-slate-500">Cities: {profile.serviceCities.join(', ')}</p>
              <button className="mt-3 text-[#22C55E] text-sm font-medium hover:underline">
                Edit Area
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="text-[#22C55E]" size={20} />
                <h3 className="font-semibold text-slate-900">Payout Method</h3>
              </div>
              <p className="text-slate-600">{profile.payoutMethod}</p>
              <p className="text-sm text-slate-500 mt-1">{profile.payoutEmail}</p>
              <button className="mt-3 text-[#22C55E] text-sm font-medium hover:underline">
                Update Payout
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={18} className="text-slate-400" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone size={18} className="text-slate-400" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Clock size={18} className="text-slate-400" />
                <span>Avg. Response Time: {profile.responseTime}</span>
              </div>
            </div>
            <button className="mt-4 text-[#22C55E] text-sm font-medium hover:underline">
              Update Contact Info
            </button>
          </div>
        </>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Service Radius */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Radius</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Maximum distance from your location</span>
                <span className="font-semibold text-[#22C55E]">{profile.serviceRadius} miles</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={profile.serviceRadius}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#22C55E]"
                readOnly
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>5 miles</span>
                <span>50 miles</span>
              </div>
            </div>
          </div>

          {/* Service Cities */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Service Cities</h3>
              <button className="text-[#22C55E] text-sm font-medium flex items-center gap-1">
                <Plus size={16} /> Add City
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.serviceCities.map((city, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
                  {city}
                  <button className="hover:text-green-900">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Services Offered */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Services Offered</h3>
              <button className="text-[#22C55E] text-sm font-medium flex items-center gap-1">
                <Edit2 size={16} /> Edit
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableServices.map((service) => {
                const isEnabled = profile.services.includes(service)
                return (
                  <div
                    key={service}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      isEnabled
                        ? 'border-[#22C55E] bg-green-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isEnabled ? 'border-[#22C55E] bg-[#22C55E]' : 'border-slate-300'
                      }`}>
                        {isEnabled && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className={`font-medium ${isEnabled ? 'text-slate-900' : 'text-slate-500'}`}>
                        {service}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Equipment */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="text-[#22C55E]" size={20} />
              <h3 className="text-lg font-semibold text-slate-900">Equipment Type</h3>
            </div>
            <div className="flex gap-3">
              {['Residential', 'Commercial', 'Both'].map((type) => (
                <button
                  key={type}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    profile.equipmentType === type
                      ? 'border-[#22C55E] bg-green-50 text-[#22C55E]'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Availability Tab */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Weekly Availability</h3>
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-900 capitalize">{formatDay(day)}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${profile.availability[day as keyof typeof profile.availability] ? 'text-green-600' : 'text-slate-400'}`}>
                    {profile.availability[day as keyof typeof profile.availability] ? 'Available' : 'Unavailable'}
                  </span>
                  <button
                    className={`w-12 h-6 rounded-full transition-colors ${
                      profile.availability[day as keyof typeof profile.availability]
                        ? 'bg-[#22C55E]'
                        : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      profile.availability[day as keyof typeof profile.availability]
                        ? 'translate-x-6'
                        : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Working Hours */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-semibold text-slate-900 mb-4">Working Hours</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Start Time</label>
                <input type="time" value="07:00" className="w-full p-2 border border-slate-300 rounded-lg" readOnly />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">End Time</label>
                <input type="time" value="19:00" className="w-full p-2 border border-slate-300 rounded-lg" readOnly />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="text-[#22C55E]" size={20} />
              <h3 className="text-lg font-semibold text-slate-900">Account Settings</h3>
            </div>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-slate-700 flex items-center gap-3">
                  <Bell size={18} className="text-slate-400" />
                  Notification Preferences
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-slate-700 flex items-center gap-3">
                  <Shield size={18} className="text-slate-400" />
                  Change Password
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-slate-700 flex items-center gap-3">
                  <CreditCard size={18} className="text-slate-400" />
                  Payment Methods
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-slate-700 flex items-center gap-3">
                  <Calendar size={18} className="text-slate-400" />
                  Schedule Settings
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
            <button className="w-full p-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              Deactivate Account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
