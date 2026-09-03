import './styles/app.css'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { GameProvider, useGame } from './ui/GameContext'
import { GameScreen } from './ui/GameScreen'
import { SetupScreen } from './ui/SetupScreen'

function AppView() {
  const { state } = useGame()
  return state.phase === 'PLAYING' ? <GameScreen /> : <SetupScreen />
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <AppView />
      </GameProvider>
    </ErrorBoundary>
  )
}
