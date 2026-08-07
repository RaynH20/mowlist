import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

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
    console.error(`ErrorBoundary${this.props.name ? ` (${this.props.name})` : ''} caught:`, error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="font-semibold text-amber-900 text-lg">Something went wrong</h2>
                <p className="text-amber-800 text-sm mt-1">
                  We hit an error rendering this page. Try reloading — if the problem persists, let us know.
                </p>
                {this.state.error && (
                  <details className="mt-3 text-xs text-amber-700">
                    <summary className="cursor-pointer font-medium">Error details</summary>
                    <pre className="mt-2 p-2 bg-amber-100 rounded text-xs overflow-auto max-h-32">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
                    </pre>
                  </details>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Reload page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 text-amber-700 hover:bg-amber-100 rounded-lg font-medium transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
