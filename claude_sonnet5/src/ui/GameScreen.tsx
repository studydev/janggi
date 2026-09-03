/**
 * 대국 화면 — 보드 + 차례/시간/점수/잡힌 기물/기보 + 컨트롤.
 * 상태는 리듀서(GameContext)로만 다루고, 규칙 판단은 엔진 순수 함수에 위임한다.
 */

import { useCallback, useMemo } from 'react'
import { generateLegalMoves, isCheck } from '../engine/rules'
import type { Position, Side } from '../engine/types'
import { useGameDispatch, useGameResult, useSession, useViewedGame } from '../game/GameContext'
import { describeMoveVerbose } from '../game/janggi-notation'
import { isGameOver } from '../game/session-types'
import { gameRecordToJson, toGameRecord } from '../game/storage'
import { Board, type Orientation } from './Board'
import { CapturedPanel } from './CapturedPanel'
import { GameOverDialog } from './GameOverDialog'
import { MoveList } from './MoveList'
import { sideLabel } from './pieceLabels'
import { ReplayControls } from './ReplayControls'
import { ScorePanel } from './ScorePanel'
import { useElapsedTime } from './useElapsedTime'

function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function GameScreen() {
  const session = useSession()
  const dispatch = useGameDispatch()
  const result = useGameResult()
  const viewed = useViewedGame()

  const over = isGameOver(result)
  const replayActive = session.replay.active
  const liveGame = session.game
  const turn: Side = liveGame.turn

  const turnInCheck = useMemo(() => isCheck(liveGame.board, turn), [liveGame.board, turn])
  const hasLegalMove = useMemo(() => generateLegalMoves(liveGame).length > 0, [liveGame])

  const checkSide: Side | null = useMemo(() => {
    for (const side of ['CHO', 'HAN'] as const) {
      if (isCheck(viewed.board, side)) return side
    }
    return null
  }, [viewed.board])

  const lastMove = useMemo(() => {
    const last = viewed.moveHistory[viewed.moveHistory.length - 1]
    if (last === undefined || last.isPass || last.from === null || last.to === null) return null
    return { from: last.from, to: last.to }
  }, [viewed.moveHistory])

  const lastMoveText = useMemo(() => {
    const h = liveGame.moveHistory
    return h.length > 0 ? describeMoveVerbose(h[h.length - 1]) : '대국 시작'
  }, [liveGame.moveHistory])

  const orientation: Orientation =
    session.options.flipToActive && turn === 'HAN' ? 'HAN_BOTTOM' : 'CHO_BOTTOM'

  const elapsed = useElapsedTime(session.startedAt, over ? session.updatedAt : null)

  const canPassNow = !over && !replayActive && !turnInCheck
  const canUndo = !replayActive && liveGame.moveHistory.length > 0 && session.manualOutcome === null
  const forcedPass = !over && !replayActive && !turnInCheck && !hasLegalMove

  const onActivateSquare = useCallback((pos: Position) => dispatch({ type: 'SQUARE_CLICK', pos }), [dispatch])
  const onDragMove = useCallback(
    (from: Position, to: Position) => dispatch({ type: 'DRAG_MOVE', from, to }),
    [dispatch],
  )
  const onClearSelection = useCallback(() => dispatch({ type: 'CLEAR_SELECTION' }), [dispatch])

  const exportGame = () =>
    downloadJson(
      `janggi-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`,
      gameRecordToJson(toGameRecord(session)),
    )

  return (
    <div className={`screen game-screen${replayActive ? ' is-replay' : ''}`}>
      <div className="board-column">
        <div className="turn-strip" aria-live="polite">
          {over ? (
            <span className="turn-over">대국 종료 — {result.reason}</span>
          ) : replayActive ? (
            <span className="turn-replay">
              기보 재생 중 · {session.replay.ply}/{liveGame.moveHistory.length}수
            </span>
          ) : (
            <>
              <span className={`turn-badge turn-${turn.toLowerCase()}`}>{sideLabel(turn)}</span>
              <span className="turn-text">
                {sideLabel(turn)} 차례
                {turnInCheck && <strong className="turn-check"> · 장군!</strong>}
                {forcedPass && <strong className="turn-check"> · 둘 수 없음, 쉬기</strong>}
              </span>
              <span className="turn-clock" aria-label="경과 시간">
                {elapsed}
              </span>
            </>
          )}
        </div>

        <Board
          board={viewed.board}
          orientation={orientation}
          script={session.options.script}
          colorblind={session.options.colorblind}
          animate={session.options.animate}
          showHints={session.options.showHints}
          interactive={!over && !replayActive}
          selected={replayActive ? null : session.selected}
          legalTargets={replayActive ? [] : session.legalTargets}
          lastMove={lastMove}
          checkSide={checkSide}
          onActivateSquare={onActivateSquare}
          onDragMove={onDragMove}
          onClearSelection={onClearSelection}
        />

        <p className="sr-only" aria-live="polite">
          마지막 수: {lastMoveText}
        </p>

        {session.drawOfferedBy !== null && !over && (
          <div className="draw-offer" role="alert">
            <span>{sideLabel(session.drawOfferedBy)}이(가) 무승부를 제안했습니다.</span>
            <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'RESPOND_DRAW', accept: true })}>
              수락
            </button>
            <button type="button" className="btn btn-sm" onClick={() => dispatch({ type: 'RESPOND_DRAW', accept: false })}>
              거절
            </button>
          </div>
        )}

        <div className="controls">
          <button type="button" className="btn" disabled={!canPassNow} onClick={() => dispatch({ type: 'PASS' })}>
            한 수 쉬기
          </button>
          <button type="button" className="btn" disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })}>
            무르기
          </button>
          <button
            type="button"
            className="btn"
            disabled={over || replayActive || session.drawOfferedBy !== null}
            onClick={() => dispatch({ type: 'OFFER_DRAW', side: turn })}
          >
            무승부 제안
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={over || replayActive}
            onClick={() => {
              if (confirm(`${sideLabel(turn)}이(가) 기권합니다. 진행할까요?`)) {
                dispatch({ type: 'RESIGN', side: turn })
              }
            }}
          >
            기권
          </button>
          {!replayActive ? (
            <button
              type="button"
              className="btn"
              disabled={liveGame.moveHistory.length === 0}
              onClick={() => dispatch({ type: 'REPLAY_ENTER' })}
            >
              기보 재생
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => dispatch({ type: 'REPLAY_EXIT' })}>
              재생 종료
            </button>
          )}
          <button type="button" className="btn" onClick={exportGame}>
            내보내기
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              if (over || confirm('현재 대국을 끝내고 새 대국을 설정할까요?')) {
                dispatch({ type: 'RESET_TO_SETUP' })
              }
            }}
          >
            새 대국
          </button>
        </div>

        <OptionBar />
      </div>

      <aside className="side-column">
        <ScorePanel scores={result.scores} />
        <CapturedPanel
          captured={liveGame.capturedPieces}
          script={session.options.script}
          colorblind={session.options.colorblind}
        />
        {replayActive && (
          <ReplayControls
            ply={session.replay.ply}
            total={liveGame.moveHistory.length}
            onSeek={(ply) => dispatch({ type: 'REPLAY_SEEK', ply })}
            onStep={(delta) => dispatch({ type: 'REPLAY_STEP', delta })}
            onExit={() => dispatch({ type: 'REPLAY_EXIT' })}
          />
        )}
        <MoveList
          moves={liveGame.moveHistory}
          currentPly={replayActive ? session.replay.ply : liveGame.moveHistory.length}
          replayActive={replayActive}
          onSeek={(ply) => dispatch({ type: 'REPLAY_SEEK', ply })}
        />
      </aside>

      {over && (
        <GameOverDialog
          result={result}
          onNewGame={() => dispatch({ type: 'RESET_TO_SETUP' })}
          onReview={() => dispatch({ type: 'REPLAY_ENTER' })}
          onExport={exportGame}
        />
      )}
    </div>
  )
}

function OptionBar() {
  const session = useSession()
  const dispatch = useGameDispatch()
  const o = session.options
  return (
    <div className="option-bar" aria-label="표시 옵션">
      <label>
        <span>표기</span>
        <select
          value={o.script}
          onChange={(e) =>
            dispatch({ type: 'SET_OPTIONS', options: { script: e.target.value as 'hanja' | 'hangul' } })
          }
        >
          <option value="hanja">한자 車</option>
          <option value="hangul">한글 차</option>
        </select>
      </label>
      <label className="option-check">
        <input
          type="checkbox"
          checked={o.colorblind}
          onChange={(e) => dispatch({ type: 'SET_OPTIONS', options: { colorblind: e.target.checked } })}
        />
        색맹 대응 팔레트
      </label>
      <label className="option-check">
        <input
          type="checkbox"
          checked={o.flipToActive}
          onChange={(e) => dispatch({ type: 'SET_OPTIONS', options: { flipToActive: e.target.checked } })}
        />
        둘 차례를 아래로
      </label>
      <label className="option-check">
        <input
          type="checkbox"
          checked={o.showHints}
          onChange={(e) => dispatch({ type: 'SET_OPTIONS', options: { showHints: e.target.checked } })}
        />
        이동 가능 표시
      </label>
      <label className="option-check">
        <input
          type="checkbox"
          checked={o.animate}
          onChange={(e) => dispatch({ type: 'SET_OPTIONS', options: { animate: e.target.checked } })}
        />
        이동 애니메이션
      </label>
    </div>
  )
}
