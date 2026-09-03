import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  readonly children: ReactNode
}

interface ErrorBoundaryState {
  readonly error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('장기 앱에서 처리되지 않은 오류가 발생했습니다.', error, info)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <h2>문제가 발생했습니다</h2>
          <p>화면을 표시하는 중 오류가 발생했습니다. 진행 중인 대국은 자동 저장되어 있을 수 있습니다.</p>
          <pre className="error-boundary__message">{this.state.error.message}</pre>
          <button type="button" onClick={this.handleReset}>
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
