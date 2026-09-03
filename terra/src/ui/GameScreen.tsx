import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Download,
  Flag,
  Handshake,
  Languages,
  Palette,
  Play,
  RotateCcw,
  SkipForward,
  Undo2,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { calculateScore } from '../engine/result'
import { pieceLabel } from '../engine/board'
import type { Move, Side } from '../engine/types'
import { formatMove, formatMoveCompact, sideName } from '../game/janggi-notation'
import type { GameContextValue } from '../game/GameContext'
import { Board } from './Board'

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function capturedPieces(moves: readonly Move[], side: Side): string[] {
  return moves
    .filter((move) => move.piece?.side === side && move.captured !== null)
    .map((move) => pieceLabel(move.captured!))
}

function resultTitle(status: string, winner: Side | null): string {
  if (status === 'DRAW') {
    return '무승부'
  }
  if (winner === null) {
    return '대국 종료'
  }
  return `${sideName(winner)} 승리`
}

interface PlayerPanelProps {
  side: Side
  active: boolean
  score: number
  seconds: number
  captured: readonly string[]
}

function PlayerPanel({ side, active, score, seconds, captured }: PlayerPanelProps) {
  const name = sideName(side)
  return (
    <section className={`player-panel player-${side.toLowerCase()}${active ? ' is-active' : ''}`} aria-label={`${name} 진영 현황`}>
      <div className="player-header">
        <span className="side-seal" aria-hidden="true">{side === 'HAN' ? '漢' : '楚'}</span>
        <div>
          <p>{name} 진영</p>
          <strong>{formatClock(seconds)}</strong>
        </div>
      </div>
      <div className="player-detail">
        <span>점수</span>
        <strong>{score.toFixed(score % 1 === 0 ? 0 : 1)}</strong>
      </div>
      <div className="captured-row">
        <span>잡은 기물</span>
        <div aria-label={`${name}이 잡은 기물`}>{captured.length === 0 ? '—' : captured.join(' ')}</div>
      </div>
    </section>
  )
}

interface IconToolButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

function IconToolButton({ label, onClick, disabled = false, children }: IconToolButtonProps) {
  return (
    <button type="button" className="icon-tool" aria-label={label} title={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

interface GameScreenProps {
  game: GameContextValue
}

export function GameScreen({ game }: GameScreenProps) {
  const {
    session,
    viewState,
    selectedMoves,
    checkedSide,
    canInteract,
    activatePosition,
    requestMove,
    deselect,
    passTurn,
    undo,
    resign,
    offerDraw,
    answerDraw,
    reopenResult,
    setReplayIndex,
    toggleBoard,
    toggleColorBlindMode,
    togglePieceLabels,
    exportGame,
    importGame,
    returnToSetup,
  } = game
  const fileInput = useRef<HTMLInputElement>(null)
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const latestMove = viewState.moveHistory.at(-1) ?? null
  const playbackIndex = session.replayIndex ?? session.game.moveHistory.length
  const hanCaptured = capturedPieces(viewState.moveHistory, 'HAN')
  const choCaptured = capturedPieces(viewState.moveHistory, 'CHO')
  const turnName = sideName(viewState.turn)

  const downloadRecord = (): void => {
    const blob = new Blob([exportGame()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `janggi-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const readRecord = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) {
      return
    }
    const accepted = importGame(await file.text())
    setImportNotice(accepted ? '기보를 불러왔습니다.' : '기보 파일 형식을 확인해 주세요.')
  }

  return (
    <section className="game-screen" aria-label="장기 대국">
      <header className="game-topbar">
        <div className="turn-status" aria-live="polite">
          <span className={`turn-indicator turn-${viewState.turn.toLowerCase()}`} aria-hidden="true" />
          <div>
            <span className="status-kicker">{session.replayIndex === null ? '현재 차례' : '기보 재생'}</span>
            <strong>
              {session.replayIndex === null ? `${turnName} 차례` : `${playbackIndex} / ${session.game.moveHistory.length}수`}
            </strong>
          </div>
        </div>
        <div className="topbar-actions">
          <IconToolButton label="판 뒤집기" onClick={toggleBoard}>
            <RotateCcw size={18} aria-hidden="true" />
          </IconToolButton>
          <IconToolButton label="색맹 대응 팔레트 전환" onClick={toggleColorBlindMode}>
            <Palette size={18} aria-hidden="true" />
          </IconToolButton>
          <IconToolButton label="기물 한글과 한자 표기 전환" onClick={togglePieceLabels}>
            <Languages size={18} aria-hidden="true" />
          </IconToolButton>
          <IconToolButton label="기보 내보내기" onClick={downloadRecord}>
            <Download size={18} aria-hidden="true" />
          </IconToolButton>
          <IconToolButton label="기보 불러오기" onClick={() => fileInput.current?.click()}>
            <Upload size={18} aria-hidden="true" />
          </IconToolButton>
          <input ref={fileInput} className="visually-hidden" type="file" accept="application/json" onChange={readRecord} />
        </div>
      </header>

      {importNotice !== null && <p className="import-notice" role="status">{importNotice}</p>}

      <div className="game-layout">
        <aside className="game-sidebar left-sidebar">
          <PlayerPanel
            side="CHO"
            active={session.replayIndex === null && session.result === null && viewState.turn === 'CHO'}
            score={calculateScore(viewState, 'CHO')}
            seconds={session.elapsed.CHO}
            captured={choCaptured}
          />
          <PlayerPanel
            side="HAN"
            active={session.replayIndex === null && session.result === null && viewState.turn === 'HAN'}
            score={calculateScore(viewState, 'HAN')}
            seconds={session.elapsed.HAN}
            captured={hanCaptured}
          />
        </aside>

        <main className="board-column">
          <div className="board-toolbar" role="toolbar" aria-label="대국 도구">
            <IconToolButton label="무르기" onClick={undo} disabled={!canInteract || session.game.moveHistory.length === 0}>
              <Undo2 size={20} aria-hidden="true" />
            </IconToolButton>
            <button type="button" className="command-button" onClick={passTurn} disabled={!canInteract}>
              <SkipForward size={17} aria-hidden="true" />
              한 수 쉬기
            </button>
            <button type="button" className="command-button" onClick={offerDraw} disabled={!canInteract}>
              <Handshake size={17} aria-hidden="true" />
              무승부
            </button>
            <button type="button" className="command-button danger-command" onClick={resign} disabled={!canInteract}>
              <Flag size={17} aria-hidden="true" />
              기권
            </button>
          </div>

          {session.result !== null && session.resultSeen && (
            <div className="result-bar" role="status">
              <span>
                <strong>{resultTitle(session.result.status, session.result.winner)}</strong>
                {session.result.reason ? ` · ${session.result.reason}` : ''}
              </span>
              <button type="button" className="link-button" onClick={reopenResult}>
                결과 보기
              </button>
            </div>
          )}

          {session.replayIndex !== null && <p className="replay-state">기보를 보고 있습니다.</p>}

          <div className="board-frame">
            <Board
              board={viewState.board}
              selected={session.replayIndex === null ? session.selected : null}
              selectedMoves={session.replayIndex === null ? selectedMoves : []}
              lastMove={latestMove}
              checkedSide={checkedSide}
              flipped={session.flipped}
              useKoreanLabels={session.useKoreanLabels}
              interactive={canInteract}
              onPositionActivate={activatePosition}
              onMoveRequest={requestMove}
              onDeselect={deselect}
            />
          </div>

          <div className="replay-controls" role="group" aria-label="기보 재생">
            <IconToolButton label="처음 수" onClick={() => setReplayIndex(0)} disabled={playbackIndex === 0}>
              <ChevronFirst size={20} aria-hidden="true" />
            </IconToolButton>
            <IconToolButton label="이전 수" onClick={() => setReplayIndex(playbackIndex - 1)} disabled={playbackIndex === 0}>
              <ChevronLeft size={20} aria-hidden="true" />
            </IconToolButton>
            <span>{playbackIndex}수</span>
            <IconToolButton
              label="다음 수"
              onClick={() => setReplayIndex(playbackIndex + 1)}
              disabled={playbackIndex === session.game.moveHistory.length}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </IconToolButton>
            <IconToolButton
              label="마지막 수"
              onClick={() => setReplayIndex(session.game.moveHistory.length)}
              disabled={playbackIndex === session.game.moveHistory.length}
            >
              <ChevronLast size={20} aria-hidden="true" />
            </IconToolButton>
          </div>
        </main>

        <aside className="game-sidebar record-sidebar">
          <div className="record-heading">
            <p className="eyebrow">MOVE RECORD</p>
            <h2>기보</h2>
          </div>
          <ol className="move-list">
            {session.game.moveHistory.length === 0 ? (
              <li className="empty-record">아직 기록된 수가 없습니다.</li>
            ) : (
              session.game.moveHistory.map((move, index) => (
                <li key={`${index}-${formatMoveCompact(move)}`}>
                  <button
                    type="button"
                    className={playbackIndex === index + 1 ? 'move-record is-current' : 'move-record'}
                    onClick={() => setReplayIndex(index + 1)}
                    aria-label={`${index + 1}수 ${formatMove(move)}`}
                  >
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{formatMoveCompact(move)}</strong>
                  </button>
                </li>
              ))
            )}
          </ol>
        </aside>
      </div>

      {session.drawOfferBy !== null && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="draw-dialog-title">
            <p className="eyebrow">DRAW OFFER</p>
            <h2 id="draw-dialog-title">무승부 제안</h2>
            <p>{sideName(session.drawOfferBy)} 진영이 무승부를 제안했습니다.</p>
            <div className="dialog-actions">
              <button type="button" className="secondary-command" onClick={() => answerDraw(false)}>계속 두기</button>
              <button type="button" className="primary-command" onClick={() => answerDraw(true)}>수락</button>
            </div>
          </section>
        </div>
      )}

      {session.result !== null && session.replayIndex === null && !session.resultSeen && (
        <div className="modal-backdrop" role="presentation">
          <section className="dialog-panel result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-dialog-title">
            <p className="eyebrow">MATCH COMPLETE</p>
            <h2 id="result-dialog-title">{resultTitle(session.result.status, session.result.winner)}</h2>
            <p>{session.result.reason}</p>
            <dl className="final-score">
              <div><dt>초</dt><dd>{calculateScore(session.game, 'CHO').toFixed(1)}</dd></div>
              <div><dt>한</dt><dd>{calculateScore(session.game, 'HAN').toFixed(1)}</dd></div>
            </dl>
            <div className="dialog-actions">
              <button type="button" className="secondary-command" onClick={() => setReplayIndex(0)}>
                <Play size={16} aria-hidden="true" />
                기보 재생
              </button>
              <button type="button" className="primary-command" onClick={returnToSetup}>새 대국</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
