// 대국 진행 화면: 보드 + 상태 패널 + 액션 버튼 + 기보 리플레이 + 종료 다이얼로그.
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, Dispatch } from 'react'
import { calculateScore, canPass, findGung, getLegalMovesFrom, isCheck, SIDE_NAME_KO } from '../engine'
import type { Side } from '../engine'
import { exportMatchAsJson, parseImportedMatch, replayMoves, savedMatchToMatchSetup } from '../state/persistence'
import type { Action, AppState } from '../state/gameReducer'
import { isLive, liveState, viewState } from '../state/gameReducer'
import { Board } from './Board'
import { CapturedPieces } from './CapturedPieces'
import './layout.css'
import { EndGameDialog } from './EndGameDialog'
import { MoveHistoryPanel } from './MoveHistoryPanel'

export interface GameScreenProps {
  readonly appState: AppState
  readonly dispatch: Dispatch<Action>
}

function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function useElapsedSeconds(active: boolean, resetKey: unknown): number {
  const [seconds, setSeconds] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = Date.now()
    setSeconds(0)
  }, [resetKey])

  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [active])

  return seconds
}

export function GameScreen({ appState, dispatch }: GameScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gameOver = appState.endReason !== null
  const elapsed = useElapsedSeconds(!gameOver, appState.match)

  if (!appState.match || appState.states.length === 0) return null

  const live = liveState(appState)
  const view = viewState(appState)
  const replaying = !isLive(appState)

  const legalTargets = appState.selected && !replaying ? getLegalMovesFrom(live, appState.selected) : []
  const checkedSide: Side | null = isCheck(view, 'HAN') ? 'HAN' : isCheck(view, 'CHO') ? 'CHO' : null
  const checkedGungPos = checkedSide ? findGung(view.board, checkedSide) : null
  const lastMove = view.moveHistory.length > 0 ? view.moveHistory[view.moveHistory.length - 1] : null

  const hanScore = calculateScore(view, 'HAN')
  const choScore = calculateScore(view, 'CHO')

  function handleExport(): void {
    const json = exportMatchAsJson(appState)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `janggi-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick(): void {
    fileInputRef.current?.click()
  }

  function handleImportFile(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const saved = parseImportedMatch(String(reader.result))
        const states = replayMoves(saved.hanSetup, saved.choSetup, saved.config, saved.moves)
        dispatch({ type: 'LOAD_MATCH', match: savedMatchToMatchSetup(saved), states, endReason: saved.endReason })
      } catch (err) {
        window.alert(err instanceof Error ? err.message : '기보를 불러오지 못했습니다.')
      }
    }
    reader.readAsText(file)
  }

  function handleResign(side: Side): void {
    if (window.confirm(`${SIDE_NAME_KO[side]}이 정말 기권하시겠습니까?`)) {
      dispatch({ type: 'RESIGN', side })
    }
  }

  return (
    <div className="game-screen">
      <div className="game-screen__board-area">
        <div className="game-screen__board-toolbar">
          <span className="turn-indicator" aria-live="polite">
            {replaying ? `리플레이 중 (${appState.viewIndex}/${live.moveHistory.length}수)` : `현재 차례: ${SIDE_NAME_KO[live.turn]}`}
            {!replaying && checkedSide && <strong className="turn-indicator__check"> — {SIDE_NAME_KO[checkedSide]} 장군!</strong>}
          </span>
          <span className="elapsed-timer">경과 {formatElapsed(elapsed)}</span>
          <button type="button" onClick={() => dispatch({ type: 'FLIP_BOARD' })}>
            보드 뒤집기
          </button>
          <button type="button" onClick={() => dispatch({ type: 'TOGGLE_HANJA' })}>
            {appState.showHanja ? '한글로 표시' : '한자로 표시'}
          </button>
        </div>

        <Board
          board={view.board}
          selected={appState.selected}
          legalTargets={legalTargets}
          lastMove={lastMove}
          checkedGungPos={checkedGungPos}
          showHanja={appState.showHanja}
          flipped={appState.boardFlipped}
          interactive={!replaying && !gameOver}
          onPointClick={(pos) => dispatch({ type: 'SELECT_POINT', pos })}
        />

        <div className="game-screen__captured">
          <CapturedPieces side="HAN" pieces={view.capturedPieces.HAN} script={appState.showHanja ? 'HANJA' : 'HANGUL'} />
          <CapturedPieces side="CHO" pieces={view.capturedPieces.CHO} script={appState.showHanja ? 'HANJA' : 'HANGUL'} />
        </div>
      </div>

      <aside className="game-screen__panel">
        <div className="score-board">
          <div>
            한 {hanScore}점
          </div>
          <div>초 {choScore}점</div>
        </div>

        {appState.pendingDrawOffer && !gameOver && (
          <div className="draw-offer-banner">
            <span>{SIDE_NAME_KO[appState.pendingDrawOffer]}측이 무승부를 제안했습니다.</span>
            <button type="button" onClick={() => dispatch({ type: 'RESPOND_DRAW', accept: true })}>
              수락
            </button>
            <button type="button" onClick={() => dispatch({ type: 'RESPOND_DRAW', accept: false })}>
              거절
            </button>
          </div>
        )}

        <div className="game-screen__actions">
          <button type="button" disabled={replaying || gameOver || !canPass(live)} onClick={() => dispatch({ type: 'PASS_TURN' })}>
            한 수 쉬기
          </button>
          <button type="button" disabled={replaying || gameOver || live.moveHistory.length === 0} onClick={() => dispatch({ type: 'UNDO_MOVE' })}>
            무르기
          </button>
          <button type="button" disabled={gameOver || !!appState.pendingDrawOffer} onClick={() => dispatch({ type: 'OFFER_DRAW', side: live.turn })}>
            무승부 제안
          </button>
          <button type="button" disabled={gameOver} onClick={() => handleResign('HAN')}>
            한 기권
          </button>
          <button type="button" disabled={gameOver} onClick={() => handleResign('CHO')}>
            초 기권
          </button>
        </div>

        <div className="game-screen__io">
          <button type="button" onClick={handleExport}>
            기보 내보내기(JSON)
          </button>
          <button type="button" onClick={handleImportClick}>
            기보 불러오기
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleImportFile} />
        </div>

        <MoveHistoryPanel moves={live.moveHistory} viewIndex={appState.viewIndex} onSelectIndex={(index) => dispatch({ type: 'GOTO_VIEW_INDEX', index })} />
      </aside>

      {appState.endReason && <EndGameDialog endReason={appState.endReason} hanScore={hanScore} choScore={choScore} onNewGame={() => dispatch({ type: 'NEW_GAME' })} />}
    </div>
  )
}
