import { useEffect, useState } from 'react'
import { GameProvider, useGameDispatch, useSession } from './game/GameContext'
import { clearSavedSession, loadSavedSession } from './game/storage'
import type { Session } from './game/session-types'
import { sideLabel } from './ui/pieceLabels'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { GameScreen } from './ui/GameScreen'
import { SetupScreen } from './ui/SetupScreen'

function RestorePrompt({
  session,
  onRestore,
  onDiscard,
}: {
  session: Session
  onRestore: () => void
  onDiscard: () => void
}) {
  const moves = session.game.moveHistory.length
  return (
    <div className="screen restore-screen">
      <div className="restore-card">
        <h1>이어서 할까요?</h1>
        <p>
          저장된 대국이 있습니다 — {moves}수 진행, {sideLabel(session.game.turn)} 차례.
        </p>
        <div className="restore-actions">
          <button type="button" className="btn btn-primary" onClick={onRestore}>
            이어서 하기
          </button>
          <button type="button" className="btn" onClick={onDiscard}>
            새로 시작
          </button>
        </div>
      </div>
    </div>
  )
}

function Shell() {
  const session = useSession()
  const dispatch = useGameDispatch()

  if (session.phase === 'setup') {
    return (
      <SetupScreen
        onStart={(choices) => dispatch({ type: 'NEW_GAME', choices })}
        onLoadSession={(s) => dispatch({ type: 'LOAD_SESSION', session: s })}
      />
    )
  }
  return <GameScreen />
}

export default function App() {
  const [saved, setSaved] = useState<Session | null | undefined>(undefined)
  const [ready, setReady] = useState(false)
  const [initial, setInitial] = useState<Session | undefined>(undefined)

  useEffect(() => {
    const s = loadSavedSession()
    setSaved(s)
    if (s === null) setReady(true)
  }, [])

  if (saved === undefined) {
    return <div className="screen loading-screen">불러오는 중…</div>
  }

  if (!ready && saved !== null) {
    return (
      <RestorePrompt
        session={saved}
        onRestore={() => {
          setInitial(saved)
          setReady(true)
        }}
        onDiscard={() => {
          clearSavedSession()
          setReady(true)
        }}
      />
    )
  }

  return (
    <ErrorBoundary>
      <GameProvider initial={initial}>
        <Shell />
      </GameProvider>
    </ErrorBoundary>
  )
}
