import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional fallback to render on error. Defaults to inline error. */
  fallback?: ReactNode
  /** Component name for debugging */
  name?: string
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * A defensive error boundary that catches errors in child components
 * (e.g. map libraries, third-party widgets) so a single broken component
 * doesn't crash the entire page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console for debugging — never crash the parent
    console.warn(`ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''} caught:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-sm">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="font-medium text-amber-900">Live tracking unavailable</p>
            <p className="text-amber-700 text-xs mt-0.5">
              We couldn't load this section right now. The rest of the page still works.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
