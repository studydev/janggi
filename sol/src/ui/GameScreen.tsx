import {
  Download,
  Flag,
  Handshake,
  Pause,
  RefreshCcw,
  RotateCcw,
  Settings,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { getPiece } from '../engine/board'
import { deserializeGame, replayState, serializeGame } from '../engine/game-record'
import { formatMove, pieceLabel } from '../engine/janggi-notation'
import { calculateScore, getGameResult, type GameResult } from '../engine/result'
import { getLegalMovesFrom, isCheck } from '../engine/rules'
import type { GameState, LegalMove, Position, Side } from '../engine/types'
import { Board } from './Board'
import { useGame } from './GameContext'

function sideName(side: Side): string {
  return side === 'CHO' ? '초' : '한'
}

function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, '0')).join(':')
}

function findCheckedSide(state: GameState): Side | null {
  if (isCheck(state, 'CHO')) return 'CHO'
  if (isCheck(state, 'HAN')) return 'HAN'
  return null
}

function PlayerRow({ state, side }: { readonly state: GameState; readonly side: Side }) {
  const captured = state.capturedPieces.filter((piece) => piece.side === side)
  const active = state.turn === side
  const checked = isCheck(state, side)

  return (
    <section className={`player-row player-row--${side.toLowerCase()}${active ? ' player-row--active' : ''}`}>
      <div className="player-identity">
        <span className="player-seal" aria-hidden="true">{side === 'CHO' ? '楚' : '漢'}</span>
        <div>
          <span>{sideName(side)}</span>
          <strong>{calculateScore(state, side).toFixed(1)}</strong>
        </div>
      </div>
      <div className="captured-list" aria-label={`${sideName(side)}이 잡힌 기물`}>
        {captured.length === 0 ? <span className="empty-captured">-</span> : captured.map((piece) => (
          <span key={piece.id}>{pieceLabel(piece.side, piece.type, 'HANGUL')}</span>
        ))}
      </div>
      <span className={`player-state${checked ? ' player-state--check' : ''}`}>
        {checked ? '장군' : active ? '착수' : '대기'}
      </span>
    </section>
  )
}

function ResultDialog({ result, game, onReview }: {
  readonly result: GameResult
  readonly game: GameState
  readonly onReview: () => void
}) {
  const { dispatch } = useGame()
  const title = result.winner ? `${sideName(result.winner)} 승` : '무승부'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="dialog result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <span className={`result-seal result-seal--${result.winner?.toLowerCase() ?? 'draw'}`} aria-hidden="true">
          {result.winner === 'CHO' ? '楚' : result.winner === 'HAN' ? '漢' : '和'}
        </span>
        <p className="eyebrow">대국 종료</p>
        <h2 id="result-title">{title}</h2>
        <p>{result.reason}</p>
        <div className="final-score">
          <span>초 <strong>{calculateScore(game, 'CHO').toFixed(1)}</strong></span>
          <i aria-hidden="true" />
          <span>한 <strong>{calculateScore(game, 'HAN').toFixed(1)}</strong></span>
        </div>
        <div className="dialog-actions">
          <button type="button" className="secondary-action" onClick={onReview}>기보 보기</button>
          <button type="button" className="primary-action" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            새 대국
          </button>
        </div>
      </section>
    </div>
  )
}

function ActiveGameScreen({ game }: { readonly game: GameState }) {
  const { state, dispatch } = useGame()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selected, setSelected] = useState<Position | null>(null)
  const [showResign, setShowResign] = useState(false)
  const [dismissedResultStatus, setDismissedResultStatus] = useState<string | null>(null)
  const [importError, setImportError] = useState('')
  const [clockNow, setClockNow] = useState(state.startedAt ?? 0)

  const engineResult = getGameResult(game)
  const result = state.overrideResult ?? engineResult
  const playing = result.status === 'PLAYING'
  const currentPly = state.replayPly ?? game.moveHistory.length
  const displayGame = state.replayPly === null ? game : replayState(game, state.replayPly)
  const isLive = state.replayPly === null
  const selectedPiece = selected ? getPiece(game.board, selected) : null
  const activeSelection = selectedPiece?.side === game.turn ? selected : null
  const legalMoves: LegalMove[] = activeSelection && isLive && playing
    ? getLegalMovesFrom(game, activeSelection)
    : []
  const lastMove = displayGame.moveHistory.at(-1) ?? null
  const checkedSide = findCheckedSide(displayGame)
  const elapsed = state.startedAt ? Math.max(0, Math.floor((clockNow - state.startedAt) / 1000)) : 0

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [playing])

  const requestMove = (from: Position, to: Position) => {
    if (!isLive || !playing) return
    const move = getLegalMovesFrom(game, from).find(
      (candidate) => candidate.to.file === to.file && candidate.to.rank === to.rank,
    )
    if (!move) return
    dispatch({ type: 'MOVE', move })
    setSelected(null)
  }

  const handlePointClick = (position: Position) => {
    if (!isLive || !playing) return
    const destination = legalMoves.find(
      (move) => move.to.file === position.file && move.to.rank === position.rank,
    )
    if (destination) {
      dispatch({ type: 'MOVE', move: destination })
      setSelected(null)
      return
    }

    const piece = getPiece(game.board, position)
    setSelected(piece?.side === game.turn ? position : null)
  }

  const handleExport = () => {
    const blob = new Blob([serializeGame(game)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `janggi-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const imported = deserializeGame(await file.text())
      dispatch({ type: 'LOAD_GAME', game: imported, now: Date.now() })
      setImportError('')
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '기보를 불러오지 못했습니다.')
    }
  }

  const setReplay = (ply: number | null) => {
    setSelected(null)
    dispatch({ type: 'SET_REPLAY', ply })
  }

  return (
    <main className={`game-screen${state.preferences.colorBlindMode ? ' color-blind-mode' : ''}`}>
      <header className="game-header">
        <button className="compact-brand" type="button" onClick={() => dispatch({ type: 'NEW_GAME' })} title="새 대국 설정">
          <span aria-hidden="true">將</span><strong>장기</strong>
        </button>
        <div className="turn-banner" aria-live="polite">
          <span className={`turn-dot turn-dot--${displayGame.turn.toLowerCase()}`} aria-hidden="true" />
          <strong>{isLive ? `${sideName(game.turn)} 차례` : `${currentPly}수 재생`}</strong>
          {checkedSide && <span className="check-badge">장군</span>}
        </div>
        <time className="game-clock">{formatElapsed(elapsed)}</time>
      </header>

      <div className="game-layout">
        <aside className="players-panel" aria-label="대국 현황">
          <div className="panel-label"><span>대국 현황</span><small>점수</small></div>
          <PlayerRow state={displayGame} side="HAN" />
          <PlayerRow state={displayGame} side="CHO" />
          <div className="rules-summary">
            <span>빅장 <strong>{game.config.bikjangEnabled ? '적용' : '해제'}</strong></span>
            <span>반복 <strong>{game.config.repetitionCount}회</strong></span>
          </div>
        </aside>

        <section className="board-column" aria-label="장기 대국">
          <div className="board-frame">
            <Board
              board={displayGame.board}
              selected={activeSelection}
              legalMoves={legalMoves}
              lastMove={lastMove}
              checkedSide={checkedSide}
              flipped={state.preferences.flipped}
              labelStyle={state.preferences.labelStyle}
              disabled={!isLive || !playing}
              onPointClick={handlePointClick}
              onMoveRequest={requestMove}
            />
          </div>
          <div className="game-controls" aria-label="대국 명령">
            <button
              type="button"
              title="한 수 쉬기"
              disabled={!isLive || !playing || checkedSide === game.turn}
              onClick={() => { setSelected(null); dispatch({ type: 'PASS' }) }}
            >
              <Pause size={19} aria-hidden="true" /> <span>한 수 쉬기</span>
            </button>
            <button
              type="button"
              title="무르기"
              disabled={!isLive || game.moveHistory.length === 0}
              onClick={() => { setSelected(null); dispatch({ type: 'UNDO' }) }}
            >
              <RotateCcw size={19} aria-hidden="true" /> <span>무르기</span>
            </button>
            <button type="button" title="무승부 제안" disabled={!isLive || !playing} onClick={() => dispatch({ type: 'OFFER_DRAW' })}>
              <Handshake size={19} aria-hidden="true" /> <span>무승부</span>
            </button>
            <button type="button" title="기권" disabled={!isLive || !playing} onClick={() => setShowResign(true)}>
              <Flag size={19} aria-hidden="true" /> <span>기권</span>
            </button>
            <button type="button" title="보드 뒤집기" onClick={() => dispatch({ type: 'TOGGLE_FLIP' })}>
              <RefreshCcw size={19} aria-hidden="true" /> <span>뒤집기</span>
            </button>
          </div>
        </section>

        <aside className="record-panel" aria-label="기보">
          <div className="record-header">
            <div><span>기보</span><small>{game.moveHistory.length}수</small></div>
            <div className="icon-actions">
              <button type="button" title="기보 내보내기" aria-label="기보 내보내기" onClick={handleExport}>
                <Download size={18} aria-hidden="true" />
              </button>
              <button type="button" title="기보 불러오기" aria-label="기보 불러오기" onClick={() => fileInputRef.current?.click()}>
                <Upload size={18} aria-hidden="true" />
              </button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={handleImport} />
            </div>
          </div>
          {importError && <div className="inline-error" role="alert"><X size={15} />{importError}</div>}
          <ol className="move-list">
            {game.moveHistory.length === 0 && <li className="empty-record">첫 수를 기다립니다.</li>}
            {game.moveHistory.map((move, index) => (
              <li key={`${index}-${move.piece?.id ?? 'pass'}`}>
                <button
                  type="button"
                  className={currentPly === index + 1 && !isLive ? 'current-move' : ''}
                  onClick={() => setReplay(index + 1)}
                >
                  <span>{index + 1}</span>
                  <strong>{move.piece?.side ? sideName(move.piece.side) : sideName(index % 2 === 0 ? 'CHO' : 'HAN')}</strong>
                  <em>{formatMove(move, state.preferences.labelStyle)}</em>
                </button>
              </li>
            ))}
          </ol>
          <div className="replay-controls">
            <button type="button" title="처음" aria-label="처음" disabled={currentPly === 0} onClick={() => setReplay(0)}><SkipBack size={18} /></button>
            <button type="button" title="이전 수" aria-label="이전 수" disabled={currentPly === 0} onClick={() => setReplay(Math.max(0, currentPly - 1))}><StepBack size={18} /></button>
            <span>{currentPly} / {game.moveHistory.length}</span>
            <button type="button" title="다음 수" aria-label="다음 수" disabled={currentPly >= game.moveHistory.length} onClick={() => setReplay(currentPly + 1)}><StepForward size={18} /></button>
            <button type="button" title="마지막" aria-label="마지막" disabled={isLive} onClick={() => setReplay(null)}><SkipForward size={18} /></button>
          </div>
          <button className="settings-link" type="button" onClick={() => dispatch({ type: 'NEW_GAME' })}>
            <Settings size={17} aria-hidden="true" /> 새 대국 설정
          </button>
        </aside>
      </div>

      {state.drawOffer && playing && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="draw-title">
            <span className="dialog-mark" aria-hidden="true"><Handshake size={24} /></span>
            <h2 id="draw-title">무승부 제안</h2>
            <p>{sideName(state.drawOffer)}가 무승부를 제안했습니다.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-action" onClick={() => dispatch({ type: 'DECLINE_DRAW' })}>계속 두기</button>
              <button type="button" className="primary-action" onClick={() => dispatch({ type: 'ACCEPT_DRAW' })}>수락</button>
            </div>
          </section>
        </div>
      )}

      {showResign && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="resign-title">
            <span className="dialog-mark" aria-hidden="true"><Flag size={24} /></span>
            <h2 id="resign-title">기권하시겠습니까?</h2>
            <p>{sideName(game.turn)}의 패배로 대국이 끝납니다.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-action" onClick={() => setShowResign(false)}>취소</button>
              <button type="button" className="danger-action" onClick={() => { setShowResign(false); dispatch({ type: 'RESIGN' }) }}>기권</button>
            </div>
          </section>
        </div>
      )}

      {!playing && dismissedResultStatus !== result.status && (
        <ResultDialog
          result={result}
          game={game}
          onReview={() => {
            setDismissedResultStatus(result.status)
            setReplay(game.moveHistory.length)
          }}
        />
      )}
    </main>
  )
}

export function GameScreen() {
  const { state } = useGame()
  if (!state.game) return null
  return <ActiveGameScreen game={state.game} />
}