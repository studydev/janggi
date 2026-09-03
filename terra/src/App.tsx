import './App.css'
import { GameConsumer, GameProvider } from './game/GameContext'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { GameScreen } from './ui/GameScreen'
import { SetupScreen } from './ui/SetupScreen'

function JanggiApplication() {
  return (
    <GameConsumer>
      {(game) => {
        const { session, restoreSavedGame, discardSavedGame } = game
        return (
          <div className={session.colorBlindMode ? 'app-shell colorblind-mode' : 'app-shell'}>
            <header className="site-header">
              <a className="brand" href="/" aria-label="장기 첫 화면">
                <span aria-hidden="true">將</span>
                <strong>장기</strong>
              </a>
              <p>LOCAL TABLE</p>
            </header>
            {session.screen === 'SETUP' ? <SetupScreen startGame={game.startGame} /> : <GameScreen game={game} />}
            {session.restoreCandidate !== null && session.screen === 'SETUP' && (
              <div className="modal-backdrop" role="presentation">
                <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="restore-dialog-title">
                  <p className="eyebrow">SAVED MATCH</p>
                  <h2 id="restore-dialog-title">진행 중인 대국</h2>
                  <p>저장된 기보와 시간을 복구할 수 있습니다.</p>
                  <div className="dialog-actions">
                    <button type="button" className="secondary-command" onClick={discardSavedGame}>새로 시작</button>
                    <button type="button" className="primary-command" onClick={restoreSavedGame}>대국 복구</button>
                  </div>
                </section>
              </div>
            )}
          </div>
        )
      }}
    </GameConsumer>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <JanggiApplication />
      </GameProvider>
    </ErrorBoundary>
  )
}

export default App
