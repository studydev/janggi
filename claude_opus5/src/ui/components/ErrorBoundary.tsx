/** 에러 바운더리 (P12). 렌더링이 깨져도 저장된 기보로 복구할 길을 남긴다. */
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearAutosave } from '../state/storage';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('장기 앱 오류', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    return (
      <div className="app">
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>화면을 그리는 중 문제가 생겼습니다</h2>
          <p className="empty-note">{error.message}</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              새로고침
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                clearAutosave();
                window.location.reload();
              }}
            >
              저장된 대국 지우고 새로 시작
            </button>
          </div>
        </div>
      </div>
    );
  }
}
