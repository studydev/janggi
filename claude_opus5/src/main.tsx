import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import './ui/styles/app.css';

const container = document.getElementById('root');
if (container === null) throw new Error('#root 를 찾지 못했습니다');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

/* PWA: 오프라인에서도 로컬 대국이 가능하도록 서비스 워커를 등록한다. */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* 등록 실패해도 앱은 정상 동작한다. */
    });
  });
}
