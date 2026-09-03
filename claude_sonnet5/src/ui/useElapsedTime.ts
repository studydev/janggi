import { useEffect, useState } from 'react'

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

/**
 * 경과 시간 "MM:SS".
 * endAt 이 null 이면 계속 흐르고, 값이 있으면 그 시점에 멈춘 시간을 보여준다.
 */
export function useElapsedTime(startedAt: number, endAt: number | null): string {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (endAt !== null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [endAt])

  return format((endAt ?? now) - startedAt)
}
