import { Component } from 'react'
import type { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="recovery-screen">
          <p className="eyebrow">RECOVERY</p>
          <h1>대국을 불러오지 못했습니다.</h1>
          <button type="button" className="primary-command" onClick={() => window.location.reload()}>
            다시 열기
          </button>
        </main>
      )
    }

    return this.props.children
  }
}
