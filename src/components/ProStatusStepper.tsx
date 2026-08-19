/**
 * Compact horizontal stepper for the pro. Shows the 6 stages of the booking
 * with the current one highlighted. Helps the pro see where the job is in
 * the flow at a glance.
 */
export default function ProStatusStepper({ status }: { status: string }) {
  const STEPS = [
    { id: 'requested', label: 'Booked' },
    { id: 'on_the_way', label: 'On way' },
    { id: 'arrived', label: 'Arrived' },
    { id: 'in_progress', label: 'Working' },
    { id: 'pending_review', label: 'Review' },
    { id: 'completed', label: 'Done' },
  ]

  // Map current status to step index
  const STATUS_TO_INDEX: Record<string, number> = {
    requested: 0,
    booked: 0,
    provider_assigned: 0,
    on_the_way: 1,
    arrived: 2,
    in_progress: 3,
    pending_review: 4,
    completed: 5,
  }
  const currentIdx = STATUS_TO_INDEX[status] ?? 0
  const isWaiting = status === 'pending_review'
  const isDone = status === 'completed'
  const isCancelled = status === 'cancelled' || status === 'disputed' || status === 'refunded'

  if (isCancelled) {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 mb-4 text-center">
        <p className="text-sm text-slate-600">This booking was {status}.</p>
      </div>
    )
  }

  return (
    <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Job progress</p>
        {isWaiting && (
          <span className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Waiting for customer
          </span>
        )}
        {isDone && <span className="text-xs text-emerald-700 font-medium">✓ Paid</span>}
      </div>
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isComplete
                      ? 'bg-[#22C55E] text-white'
                      : isCurrent
                      ? isWaiting
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-[#22C55E] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isComplete ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] mt-0.5 whitespace-nowrap ${
                  isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-0.5 ${
                    isComplete ? 'bg-[#22C55E]' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
