import { useEffect, useRef } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, NotebookPen } from 'lucide-react'
import { calculateScore } from '../engine/result'
import { formatMove, pieceLabel, SIDE_NAMES } from '../engine/janggi-notation'
import type { GameState, Side } from '../engine/types'
import { useGame } from './game-context'
import { IconButton } from './IconButton'

export function PlayerBar({ side, game, active }: { side: Side; game: GameState; active: boolean }) {
  const captures = game.capturedPieces.filter((piece) => piece.side !== side)
  return <section className={`player-bar side--${side} ${active ? 'is-active' : ''}`} aria-label={`${SIDE_NAMES[side]} 진영`}>
    <div className="player-seal" aria-hidden="true">{side === 'CHO' ? '楚' : '漢'}</div>
    <div className="player-info"><div className="player-name"><strong>{SIDE_NAMES[side]} 진영</strong>{active && <span className="turn-tag">차례</span>}</div>
      <div className="captures" aria-label={`${SIDE_NAMES[side]}가 잡은 기물`}>
        {captures.length ? captures.map((piece) => <span key={piece.id} title={pieceLabel(piece, 'hangul')}>{pieceLabel(piece)}</span>) : <span className="player-detail">{side === 'CHO' ? '선수' : '후수 · 덤 1.5점'}</span>}
      </div>
    </div>
    <div className="player-score"><strong>{calculateScore(game, side)}</strong><span>점</span></div>
  </section>
}

export function RecordPanel() {
  const { state, dispatch } = useGame()
  const list = useRef<HTMLDivElement>(null)
  const history = state.game.moveHistory
  const cursor = state.cursor ?? history.length
  useEffect(() => {
    if (list.current && state.cursor === null) list.current.scrollTop = list.current.scrollHeight
  }, [history.length, state.cursor])
  return <section className="record-panel" aria-labelledby="record-title">
    <div className="record-heading"><h3 id="record-title">기보</h3><span>{history.length}수</span></div>
    <div className="record-columns" aria-hidden="true"><span>#</span><span className="cho-text">초 楚</span><span className="han-text">한 漢</span></div>
    <div className="record-list" ref={list}>
      {history.length === 0 ? <div className="empty-record"><NotebookPen size={31} strokeWidth={1.2} aria-hidden="true" /><span>아직 기록된 수가 없습니다</span></div>
        : Array.from({ length: Math.ceil(history.length / 2) }, (_, row) => <div className="record-row" key={row}>
          <span className="move-number">{row + 1}</span>
          {[row * 2, row * 2 + 1].map((index) => history[index] ? <button type="button" key={index}
            className={`move-entry ${state.cursor === index + 1 ? 'is-current' : ''}`}
            aria-label={`${index + 1}수 ${formatMove(history[index])}`} aria-current={state.cursor === index + 1 ? 'step' : undefined}
            onClick={() => dispatch({ type: 'REPLAY', cursor: index + 1 })}>{formatMove(history[index])}</button> : <span key={index} />)}
        </div>)}
    </div>
    <div className="replay-controls" role="group" aria-label="기보 탐색">
      <IconButton label="처음 수로" icon={ChevronsLeft} disabled={history.length === 0 || cursor === 0} onClick={() => dispatch({ type: 'REPLAY', cursor: 0 })} />
      <IconButton label="이전 수로" icon={ChevronLeft} disabled={history.length === 0 || cursor === 0} onClick={() => dispatch({ type: 'REPLAY', cursor: cursor - 1 })} />
      <span className="replay-count">{cursor}<span> / {history.length}</span></span>
      <IconButton label="다음 수로" icon={ChevronRight} disabled={cursor >= history.length} onClick={() => dispatch({ type: 'REPLAY', cursor: cursor + 1 })} />
      <IconButton label="마지막 수로" icon={ChevronsRight} disabled={cursor >= history.length} onClick={() => dispatch({ type: 'REPLAY', cursor: history.length })} />
    </div>
    {state.cursor !== null && <button className="button return-live" type="button" onClick={() => dispatch({ type: 'REPLAY', cursor: null })}><ArrowLeft size={16} aria-hidden="true" />대국으로 돌아가기</button>}
  </section>
}