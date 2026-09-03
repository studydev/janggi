import { useEffect, useRef } from 'react'
import type { Move } from '../engine/types'
import { describeMoveWithCapture } from '../game/janggi-notation'

/**
 * 기보 목록. 항목 클릭 → 해당 수 직후 국면으로 리플레이 이동.
 * 리플레이 중이 아니면 새 수가 들어올 때 맨 아래로 스크롤.
 */
export function MoveList({
  moves,
  currentPly,
  replayActive,
  onSeek,
}: {
  moves: readonly Move[]
  currentPly: number
  replayActive: boolean
  onSeek: (ply: number) => void
}) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!replayActive && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [moves.length, replayActive])

  return (
    <section className="panel movelist-panel" aria-label="기보">
      <h2 className="panel-title">기보 ({moves.length}수)</h2>
      <ol className="movelist" ref={listRef}>
        <li>
          <button
            type="button"
            className={`movelist-item${currentPly === 0 ? ' is-current' : ''}`}
            onClick={() => onSeek(0)}
          >
            <span className="movelist-num">0</span> 시작 국면
          </button>
        </li>
        {moves.map((move, i) => (
          <li key={i}>
            <button
              type="button"
              className={`movelist-item${currentPly === i + 1 ? ' is-current' : ''} move-${move.piece?.side.toLowerCase() ?? 'pass'}`}
              onClick={() => onSeek(i + 1)}
            >
              <span className="movelist-num">{i + 1}</span>
              {describeMoveWithCapture(move)}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
