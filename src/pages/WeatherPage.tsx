import { Cloud, CloudRain, Sun, RefreshCw, Calendar, AlertTriangle, CheckCircle, Clock, Mail } from 'lucide-react'

export default function WeatherPage() {
  return (
    <div className="pt-24 pb-16 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudRain className="text-[#22C55E]" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Weather Rescheduling Policy</h1>
          <p className="text-lg text-slate-600">Last updated: March 2026</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-8">
          {/* Overview */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Our Commitment to Quality Service</h2>
            <p className="text-slate-600 leading-relaxed">
              Weather can be unpredictable, and we want to ensure your lawn gets the best care possible. This policy explains how we handle weather-related service adjustments.
            </p>
          </section>

          {/* Weather Conditions */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">When Weather Affects Service</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <CloudRain className="text-red-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-red-900">Heavy Rain</h3>
                  <p className="text-red-700 mt-1">Service will be rescheduled automatically. We'll notify you of the new date.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <Cloud className="text-amber-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-amber-900">Light Rain / Wet Conditions</h3>
                  <p className="text-amber-700 mt-1">Provider will assess conditions and may proceed or reschedule as needed.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                <Sun className="text-green-600 mt-1 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-semibold text-green-900">Clear Weather</h3>
                  <p className="text-green-700 mt-1">Service will proceed as scheduled. No action needed.</p>
                </div>
              </div>
            </div>
          </section>

          {/* What Happens */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">What Happens When Weather Impacts Service</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Automatic Rescheduling</h3>
                  <p className="text-slate-600">If weather prevents service, we'll automatically reschedule to the next available slot that's convenient for you.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Notification</h3>
                  <p className="text-slate-600">You'll receive an email and/or SMS notification about any changes to your service schedule.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-slate-900">Easy Rescheduling</h3>
                  <p className="text-slate-600">You can easily reschedule through your account if the proposed new time doesn't work for you.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recurring Services */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recurring Services</h2>
            <p className="text-slate-600 leading-relaxed">
              For recurring service customers, if weather causes a missed service, we'll automatically add the service to the end of your billing cycle at no additional cost. Your lawn will still receive the agreed-upon number of visits.
            </p>
          </section>

          {/* Your Options */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Your Options</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600">
                <Clock className="text-[#22C55E]" size={20} />
                <span>Skip a service if you're going to be away</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <RefreshCw className="text-[#22C55E]" size={20} />
                <span>Pause your recurring service during winter months</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar className="text-[#22C55E]" size={20} />
                <span>Request a specific reschedule date that works for you</span>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
            <div className="flex items-start gap-3">
              <Mail className="text-[#22C55E] mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="text-slate-600">If you have questions about weather-related rescheduling, please contact us at support@mowlist.com.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
