import { GameProvider } from './ui/GameContext'
import { GameScreen } from './ui/GameScreen'
import { SetupScreen } from './ui/SetupScreen'
import { useGame } from './ui/useGame'

function AppContent() {
  const { state, dispatch } = useGame()
  return (
    <>
      {state.screen === 'setup' ? <SetupScreen /> : <GameScreen />}
      {state.restoreCandidate !== null && (
        <div className="restore-overlay"><section className="restore-dialog" role="dialog" aria-modal="true" aria-labelledby="restore-title"><span className="result-kicker">SAVED MATCH</span><h2 id="restore-title">진행 중인 대국이 있습니다.</h2><p>이전에 저장한 기보를 이어서 볼까요?</p><div className="restore-actions"><button className="start-button" type="button" onClick={() => dispatch({ type: 'RESTORE_SESSION' })}>이어서 하기</button><button className="secondary-action" type="button" onClick={() => dispatch({ type: 'DISMISS_RESTORE' })}>새로 시작</button></div></section></div>
      )}
    </>
  )
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}

export default App
