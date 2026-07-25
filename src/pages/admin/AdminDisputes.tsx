import { AlertTriangle } from 'lucide-react'

export default function AdminDisputes() {
  const disputes = []

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Disputes</h1>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {disputes.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Disputes</h3>
            <p className="text-slate-600">There are no open disputes at this time.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-slate-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Issue</th>
                <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Disputes would go here */}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
