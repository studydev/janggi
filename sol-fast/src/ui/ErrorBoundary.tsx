import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'

interface ErrorBoundaryState {
  readonly failed: boolean
}

export class ErrorBoundary extends Component<{ readonly children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Janggi UI error', error, info)
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="error-state">
          <span className="brand-seal" aria-hidden="true">將</span>
          <h1>대국판을 복구할 수 없습니다.</h1>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            <RotateCcw aria-hidden="true" /> 다시 열기
          </button>
        </main>
      )
    }
    return this.props.children
  }
}