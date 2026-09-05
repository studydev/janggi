import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  readonly children: ReactNode
}

interface ErrorBoundaryState {
  readonly failed: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Janggi UI error', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="error-screen">
          <span className="brand-seal" aria-hidden="true">將</span>
          <h1>화면을 복구하지 못했습니다.</h1>
          <button type="button" className="primary-action" onClick={() => window.location.reload()}>
            다시 열기
          </button>
        </main>
      )
    }
    return this.props.children
  }
}
