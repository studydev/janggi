import { Component, type ErrorInfo, type ReactNode } from 'react';
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('수담 화면 오류', error, info.componentStack); }
  render() {
    if (this.state.failed) return <main className="error-page"><div className="brand-symbol">楚</div><h1>잠시 수를 고르고 있습니다.</h1><p>화면을 다시 열면 자동 저장된 대국을 복구할 수 있습니다.</p><button className="primary-button" onClick={() => location.reload()}>화면 다시 열기</button></main>;
    return this.props.children;
  }
}
