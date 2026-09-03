import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearSavedSession } from '../game/storage'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Janggi UI 오류:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error === null) return this.props.children
    return (
      <div className="screen error-screen" role="alert">
        <h1>문제가 발생했습니다</h1>
        <p className="error-message">{this.state.error.message}</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            다시 시도
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              clearSavedSession()
              location.reload()
            }}
          >
            저장 지우고 새로 시작
          </button>
        </div>
      </div>
    )
  }
}
