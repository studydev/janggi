import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const rootEl = document.getElementById('root')
if (rootEl === null) throw new Error('#root 를 찾을 수 없습니다.')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: 오프라인에서 로컬 대국이 가능하도록 서비스 워커 등록 (프로덕션에서만).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => {
      /* 등록 실패는 조용히 무시 — 앱은 계속 동작 */
    })
  })
}
