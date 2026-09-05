import { useEffect, useState } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useGame } from './game-context'
import { IconButton } from './IconButton'
import { saveMatch } from './storage'

export function PwaStatus() {
  const { state } = useGame()
  const [online, setOnline] = useState(navigator.onLine)
  const [installed, setInstalled] = useState(import.meta.env.PROD && !!navigator.serviceWorker?.controller)
  const [error, setError] = useState(false)
  const { offlineReady: [offlineReady], needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisterError: () => setError(true),
  })

  useEffect(() => {
    let cancelled = false
    const updateNetwork = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.ready.then(() => { if (!cancelled) setInstalled(true) })
    }
    return () => {
      cancelled = true
      window.removeEventListener('online', updateNetwork)
      window.removeEventListener('offline', updateNetwork)
    }
  }, [])

  async function updateApp() {
    if (saveMatch(state)) { setError(true); return }
    try { await updateServiceWorker(true) }
    catch { setError(true) }
  }

  const label = !online ? '오프라인' : error ? '오프라인 저장 실패' : installed || offlineReady ? '오프라인 준비 완료' : '온라인'
  return <div className="pwa-status" role="status">{online ? <Wifi size={13} aria-hidden="true" /> : <WifiOff size={13} aria-hidden="true" />}<span>{label}</span>
    {needRefresh && <IconButton label="업데이트 적용" icon={RefreshCw} onClick={() => void updateApp()} />}
  </div>
}