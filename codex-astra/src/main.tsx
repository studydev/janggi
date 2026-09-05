import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './ui/App';
import { GameProvider } from './game';
import ErrorBoundary from './ui/ErrorBoundary';
import './ui/fonts.css';
import './ui/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary><GameProvider><App /></GameProvider></ErrorBoundary></React.StrictMode>,
);
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(error => {
    console.warn('오프라인 저장을 사용할 수 없습니다.', error);
    window.dispatchEvent(new Event('sudam:offline-failed'));
  });
}
