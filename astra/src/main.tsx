import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/noto-sans-kr/400.css'
import '@fontsource/noto-sans-kr/600.css'
import '@fontsource/noto-serif-kr/600.css'
import './ui/styles.css'
import App from './App.tsx'
import { ErrorBoundary } from './ui/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
