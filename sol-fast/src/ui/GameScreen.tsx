import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Flag,
  FlipVertical2,
  Handshake,
  Home,
  Pause,
  Radio,
  RotateCcw,
  SkipBack,
  SkipForward,
  Undo2,
  Upload,
  X,
} from 'lucide-react'
import { getPiece, oppositeSide } from '../engine/board'
import { parseGame, replayGame, serializeGame } from '../engine/game-record'
import { formatMove, getPieceName } from '../engine/janggi-notation'
import { calculateScore } from '../engine/result'
import { findGeneral, getLegalMovesFrom, isCheck, samePosition } from '../engine/rules'
import type { GameState, Position, Side } from '../engine/types'
import { SAVE_KEY } from '../game/game-state'
import { useGame } from '../game/useGame'
import { Board } from './Board'
import { Modal } from './Modal'

function sideName(side: Side): string {
  return side === 'HAN' ? '한' : '초'
}

function formatElapsed(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remaining = seconds % 60
  return [hours, minutes, remaining].map((value) => String(value).padStart(2, '0')).join(':')
}

function PlayerPanel({ game, side }: { readonly game: GameState; readonly side: Side }) {
  const captured = game.capturedPieces.filter((piece) => piece.side === side)
  const active = game.turn === side
  return (
    <section className={`player-panel player-panel--${side.toLowerCase()}${active ? ' player-panel--active' : ''}`}>
      <div className="player-identity">
        <span className="player-mark" aria-hidden="true">{side === 'HAN' ? '漢' : '楚'}</span>
        <span>
          <small>{side === 'HAN' ? '후수 · 덤 1.5' : '선수'}</small>
          <strong>{sideName(side)} 진영</strong>
        </span>
      </div>
      <strong className="player-score">{calculateScore(game, side)}</strong>
      <div className="captured-list" aria-label={`${sideName(side)}이 잃은 기물`}>
        {captured.length === 0
          ? <span className="empty-captures">잡힌 기물 없음</span>
          : captured.map((piece) => (
            <span className="captured-piece" key={piece.id}>{getPieceName(piece)}</span>
          ))}
      </div>
    </section>
  )
}

export function GameScreen() {
  const { state, dispatch } = useGame()
  const [selection, setSelection] = useState<{ readonly position: Position; readonly key: string } | null>(null)
  const [now, setNow] = useState(state.startedAt)
  const [notice, setNotice] = useState('')
  const [confirmResign, setConfirmResign] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const [dismissedResult, setDismissedResult] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const replaying = state.replayIndex !== null
  const interactionKey = `${state.game.positionHistory.at(-1) ?? ''}:${state.replayIndex ?? 'live'}`
  const selected = selection?.key === interactionKey ? selection.position : null
  const displayGame = replaying
    ? replayGame(state.game, state.replayIndex ?? state.game.moveHistory.length)
    : state.game
  const canPlay = !replaying && state.result.status === 'PLAYING'
  const legalMoves = selected && canPlay ? getLegalMovesFrom(state.game, selected) : []
  const checkedGeneral = isCheck(displayGame, displayGame.turn)
    ? findGeneral(displayGame.board, displayGame.turn)
    : null
  const currentReplayIndex = state.replayIndex ?? state.game.moveHistory.length
  const elapsed = Math.max(0, Math.floor((now - state.startedAt) / 1000))
  const resultKey = `${state.result.status}:${state.game.moveHistory.length}`
  const resultOpen = state.result.status !== 'PLAYING' && dismissedResult !== resultKey

  useEffect(() => {
    if (state.result.status !== 'PLAYING') return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [state.result.status])

  function activatePosition(position: Position): void {
    if (!canPlay) return
    const piece = getPiece(state.game.board, position)

    if (selected) {
      const move = legalMoves.find((candidate) => samePosition(candidate.to, position))
      if (move) {
        dispatch({ type: 'MOVE', move })
        setSelection(null)
        return
      }
    }

    setSelection(piece?.side === state.game.turn ? { position, key: interactionKey } : null)
  }

  function dragMove(from: Position, to: Position): void {
    if (!canPlay) return
    const move = getLegalMovesFrom(state.game, from)
      .find((candidate) => samePosition(candidate.to, to))
    if (move) {
      dispatch({ type: 'MOVE', move })
      setSelection(null)
    } else {
      const piece = getPiece(state.game.board, from)
      setSelection(piece?.side === state.game.turn ? { position: from, key: interactionKey } : null)
    }
  }

  function exportRecord(): void {
    const blob = new Blob([serializeGame(state.game)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `janggi-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice('기보를 내보냈습니다.')
  }

  async function importRecord(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const game = parseGame(await file.text())
      dispatch({ type: 'RESTORE', game, now: Date.now() })
      setNotice('기보를 불러왔습니다.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '기보를 불러오지 못했습니다.')
    } finally {
      event.target.value = ''
    }
  }

  function startNewGame(): void {
    localStorage.removeItem(SAVE_KEY)
    dispatch({ type: 'NEW_GAME' })
  }

  return (
    <main className="game-screen">
      <header className="brand-header game-header">
        <div className="brand-lockup brand-lockup--compact">
          <span className="brand-seal" aria-hidden="true">將</span>
          <div>
            <p className="eyebrow">LOCAL MATCH</p>
            <h1>두는 장기</h1>
          </div>
        </div>
        <div className="match-status" aria-live="polite">
          {replaying ? (
            <span className="replay-badge"><Radio aria-hidden="true" /> 기보 {currentReplayIndex}/{state.game.moveHistory.length}</span>
          ) : (
            <span className={`turn-badge turn-badge--${state.game.turn.toLowerCase()}`}>
              {isCheck(state.game, state.game.turn) ? '장군 · ' : ''}{sideName(state.game.turn)} 차례
            </span>
          )}
          <span className="timer"><Clock3 aria-hidden="true" /> {formatElapsed(elapsed)}</span>
        </div>
        <div className="header-actions">
          <div className="segmented-control" aria-label="기물 표기">
            <button
              type="button"
              aria-pressed={state.labelMode === 'HANJA'}
              onClick={() => dispatch({ type: 'SET_LABEL_MODE', mode: 'HANJA' })}
            >한자</button>
            <button
              type="button"
              aria-pressed={state.labelMode === 'HANGUL'}
              onClick={() => dispatch({ type: 'SET_LABEL_MODE', mode: 'HANGUL' })}
            >한글</button>
          </div>
          <button className="icon-button" type="button" onClick={() => dispatch({ type: 'TOGGLE_FLIP' })} title="보드 뒤집기">
            <FlipVertical2 aria-hidden="true" /><span className="sr-only">보드 뒤집기</span>
          </button>
          <button className="icon-button" type="button" onClick={() => setConfirmNew(true)} title="새 대국">
            <Home aria-hidden="true" /><span className="sr-only">새 대국</span>
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button className="icon-button" type="button" onClick={() => setNotice('')} title="알림 닫기">
            <X aria-hidden="true" /><span className="sr-only">알림 닫기</span>
          </button>
        </div>
      )}

      <div className="game-layout">
        <aside className="match-panel" aria-label="대국 현황">
          <PlayerPanel game={displayGame} side="CHO" />
          <div className="match-divider"><span>대국 점수</span></div>
          <PlayerPanel game={displayGame} side="HAN" />

          <div className="display-options">
            <label className="toggle-row compact-toggle">
              <span><strong>색각 보정</strong></span>
              <input
                type="checkbox"
                checked={state.colorBlind}
                onChange={() => dispatch({ type: 'TOGGLE_COLOR_BLIND' })}
              />
            </label>
          </div>
        </aside>

        <section className="board-column" aria-label="대국판">
          <div className="board-frame">
            <Board
              board={displayGame.board}
              selected={selected}
              legalMoves={legalMoves}
              lastMove={displayGame.moveHistory.at(-1) ?? null}
              checkedGeneral={checkedGeneral}
              flipped={state.flipped}
              labelMode={state.labelMode}
              colorBlind={state.colorBlind}
              disabled={!canPlay}
              onPositionActivate={activatePosition}
              onDragMove={dragMove}
            />
            {replaying && (
              <div className="replay-overlay-label">
                <Radio aria-hidden="true" /> 리플레이
              </div>
            )}
          </div>

          <div className="game-actions">
            <button
              type="button"
              disabled={!canPlay || isCheck(state.game, state.game.turn)}
              onClick={() => dispatch({ type: 'PASS' })}
            >
              <Pause aria-hidden="true" /> 한 수 쉬기
            </button>
            <button
              type="button"
              disabled={!canPlay || state.game.moveHistory.length === 0}
              onClick={() => dispatch({ type: 'UNDO' })}
            >
              <Undo2 aria-hidden="true" /> 무르기
            </button>
            <button type="button" disabled={!canPlay} onClick={() => dispatch({ type: 'OFFER_DRAW' })}>
              <Handshake aria-hidden="true" /> 무승부 제안
            </button>
            <button className="danger-button" type="button" disabled={!canPlay} onClick={() => setConfirmResign(true)}>
              <Flag aria-hidden="true" /> 기권
            </button>
          </div>
        </section>

        <aside className="record-panel" aria-labelledby="record-title">
          <div className="record-header">
            <div>
              <p className="eyebrow">棋譜</p>
              <h2 id="record-title">대국 기록</h2>
            </div>
            <span>{state.game.moveHistory.length}수</span>
          </div>

          <div className="replay-controls" aria-label="기보 재생">
            <button type="button" onClick={() => dispatch({ type: 'SET_REPLAY', index: 0 })} disabled={state.game.moveHistory.length === 0} title="처음">
              <SkipBack aria-hidden="true" /><span className="sr-only">처음</span>
            </button>
            <button type="button" onClick={() => dispatch({ type: 'SET_REPLAY', index: currentReplayIndex - 1 })} disabled={state.game.moveHistory.length === 0 || currentReplayIndex === 0} title="이전">
              <ChevronLeft aria-hidden="true" /><span className="sr-only">이전</span>
            </button>
            <span>{currentReplayIndex} / {state.game.moveHistory.length}</span>
            <button type="button" onClick={() => dispatch({ type: 'SET_REPLAY', index: currentReplayIndex + 1 })} disabled={!replaying || currentReplayIndex >= state.game.moveHistory.length} title="다음">
              <ChevronRight aria-hidden="true" /><span className="sr-only">다음</span>
            </button>
            <button type="button" onClick={() => dispatch({ type: 'SET_REPLAY', index: state.game.moveHistory.length })} disabled={state.game.moveHistory.length === 0} title="마지막">
              <SkipForward aria-hidden="true" /><span className="sr-only">마지막</span>
            </button>
          </div>

          {replaying && (
            <button className="live-button" type="button" onClick={() => dispatch({ type: 'SET_REPLAY', index: null })}>
              <RotateCcw aria-hidden="true" /> 대국으로 돌아가기
            </button>
          )}

          <ol className="move-list">
            {state.game.moveHistory.length === 0 && <li className="empty-record">아직 기록된 수가 없습니다.</li>}
            {state.game.moveHistory.map((move, index) => (
              <li key={`${index}-${formatMove(move)}`}>
                <button
                  type="button"
                  className={state.replayIndex === index + 1 ? 'active' : ''}
                  onClick={() => dispatch({ type: 'SET_REPLAY', index: index + 1 })}
                >
                  <span>{index + 1}</span>
                  <strong>{formatMove(move)}</strong>
                  {move.captured && <small>잡음 · {getPieceName(move.captured)}</small>}
                </button>
              </li>
            ))}
          </ol>

          <div className="record-actions">
            <button type="button" onClick={exportRecord}>
              <Download aria-hidden="true" /> 내보내기
            </button>
            <button type="button" onClick={() => fileInput.current?.click()}>
              <Upload aria-hidden="true" /> 불러오기
            </button>
            <input
              ref={fileInput}
              className="visually-hidden-input"
              type="file"
              accept="application/json,.json"
              onChange={importRecord}
            />
          </div>
        </aside>
      </div>

      <Modal
        open={state.drawOfferBy !== null}
        title="무승부 제안"
        urgent
        footer={(
          <>
            <button type="button" onClick={() => dispatch({ type: 'DECLINE_DRAW' })}><X aria-hidden="true" /> 거절</button>
            <button className="primary-button" type="button" onClick={() => dispatch({ type: 'ACCEPT_DRAW' })}><Check aria-hidden="true" /> 수락</button>
          </>
        )}
      >
        <p>{state.drawOfferBy ? sideName(oppositeSide(state.drawOfferBy)) : ''} 진영이 결정할 차례입니다.</p>
      </Modal>

      <Modal
        open={confirmResign}
        title="기권하시겠습니까?"
        onClose={() => setConfirmResign(false)}
        urgent
        footer={(
          <>
            <button type="button" onClick={() => setConfirmResign(false)}>계속 두기</button>
            <button className="danger-button" type="button" onClick={() => {
              setConfirmResign(false)
              dispatch({ type: 'RESIGN' })
            }}><Flag aria-hidden="true" /> 기권</button>
          </>
        )}
      >
        <p>{sideName(state.game.turn)} 진영의 패배로 기록됩니다.</p>
      </Modal>

      <Modal
        open={confirmNew}
        title="새 대국을 시작할까요?"
        onClose={() => setConfirmNew(false)}
        footer={(
          <>
            <button type="button" onClick={() => setConfirmNew(false)}>취소</button>
            <button className="primary-button" type="button" onClick={startNewGame}><Home aria-hidden="true" /> 설정으로</button>
          </>
        )}
      >
        <p>현재 대국은 자동 저장에서 제거됩니다.</p>
      </Modal>

      <Modal
        open={resultOpen}
        title={state.result.winner ? `${sideName(state.result.winner)} 승리` : '무승부'}
        onClose={() => setDismissedResult(resultKey)}
        urgent
        footer={(
          <>
            <button type="button" onClick={() => setDismissedResult(resultKey)}>기보 보기</button>
            <button className="primary-button" type="button" onClick={startNewGame}><Home aria-hidden="true" /> 새 대국</button>
          </>
        )}
      >
        <p className="result-reason">{state.result.reason}</p>
        <div className="final-score">
          <span>초 <strong>{calculateScore(state.game, 'CHO')}</strong></span>
          <span>한 <strong>{calculateScore(state.game, 'HAN')}</strong></span>
        </div>
      </Modal>
    </main>
  )
}