import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { clearAutosave } from '../state/storage';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** 화면이 통째로 죽는 것을 막고, 저장된 대국이 원인일 때 지우고 복구할 수 있게 한다. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('렌더링 중 오류', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash">
        <h1>문제가 생겼다</h1>
        <p className="crash__message">{error.message}</p>
        <div className="btnrow">
          <button type="button" className="btn btn--primary" onClick={() => this.setState({ error: null })}>
            다시 시도
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              clearAutosave();
              window.location.reload();
            }}
          >
            저장된 대국 지우고 새로 시작
          </button>
        </div>
      </div>
    );
  }
}
