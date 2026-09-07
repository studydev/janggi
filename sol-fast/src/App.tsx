import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { parseGame } from './engine/game-record'
import type { GameState } from './engine/types'
import { GameProvider } from './game/GameProvider'
import { SAVE_KEY } from './game/game-state'
import { useGame } from './game/useGame'
import { GameScreen } from './ui/GameScreen'
import { Modal } from './ui/Modal'
import { SetupScreen } from './ui/SetupScreen'
import './App.css'

function loadSavedGame(): GameState | null {
  const saved = localStorage.getItem(SAVE_KEY)
  if (!saved) return null
  try {
    return parseGame(saved)
  } catch {
    return null
  }
}

function AppContent() {
  const { state, dispatch } = useGame()
  const [savedGame, setSavedGame] = useState<GameState | null>(loadSavedGame)

  return (
    <>
      {state.phase === 'SETUP' ? <SetupScreen /> : <GameScreen />}
      <Modal
        open={savedGame !== null && state.phase === 'SETUP'}
        title="진행 중인 대국"
        urgent
        footer={(
          <>
            <button type="button" onClick={() => {
              localStorage.removeItem(SAVE_KEY)
              setSavedGame(null)
            }}><Trash2 aria-hidden="true" /> 삭제</button>
            <button className="primary-button" type="button" onClick={() => {
              if (savedGame) dispatch({ type: 'RESTORE', game: savedGame, now: Date.now() })
              setSavedGame(null)
            }}><Check aria-hidden="true" /> 이어 두기</button>
          </>
        )}
      >
        <p>{savedGame?.moveHistory.length ?? 0}수까지 저장되어 있습니다.</p>
      </Modal>
    </>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
