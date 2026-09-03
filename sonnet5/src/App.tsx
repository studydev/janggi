// 최상위 앱: 화면 전환(설정/대국) + 자동저장 복구 다이얼로그 + 오류 경계.
import { useEffect, useReducer, useState } from 'react'
import { createFreshAppState, gameReducer } from './state/gameReducer'
import { clearAutosave, loadAutosave, replayMoves, saveAutosave, savedMatchToMatchSetup } from './state/persistence'
import type { SavedMatch } from './state/persistence'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { GameScreen } from './ui/GameScreen'
import './ui/layout.css'
import { SetupScreen } from './ui/SetupScreen'

function RestoreDialog({ onRestore, onDiscard }: { onRestore: () => void; onDiscard: () => void }) {
  return (
    <div className="restore-dialog__backdrop">
      <div className="restore-dialog" role="dialog" aria-modal="true">
        <h2>이어서 하시겠습니까?</h2>
        <p>저장된 대국이 있습니다. 이어서 진행하거나 새로 시작할 수 있습니다.</p>
        <div className="restore-dialog__actions">
          <button type="button" onClick={onRestore} autoFocus>
            이어서 하기
          </button>
          <button type="button" onClick={onDiscard}>
            새로 시작
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, createFreshAppState())
  const [pendingRestore, setPendingRestore] = useState<SavedMatch | null>(null)

  useEffect(() => {
    setPendingRestore(loadAutosave())
  }, [])

  useEffect(() => {
    if (state.screen === 'PLAYING') saveAutosave(state)
  }, [state])

  function handleRestore(saved: SavedMatch): void {
    const states = replayMoves(saved.hanSetup, saved.choSetup, saved.config, saved.moves)
    dispatch({ type: 'LOAD_MATCH', match: savedMatchToMatchSetup(saved), states, endReason: saved.endReason })
    setPendingRestore(null)
  }

  function handleDiscard(): void {
    clearAutosave()
    setPendingRestore(null)
  }

  return (
    <ErrorBoundary>
      {pendingRestore && <RestoreDialog onRestore={() => handleRestore(pendingRestore)} onDiscard={handleDiscard} />}
      {state.screen === 'SETUP' && <SetupScreen onStart={(match) => dispatch({ type: 'START_GAME', match })} />}
      {state.screen === 'PLAYING' && <GameScreen appState={state} dispatch={dispatch} />}
    </ErrorBoundary>
  )
}

export default App

