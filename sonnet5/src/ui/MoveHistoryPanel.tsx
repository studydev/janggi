// 기보 목록 + 리플레이 내비게이션.
import { formatMoveList } from '../engine'
import type { Move } from '../engine'

export interface MoveHistoryPanelProps {
  readonly moves: readonly Move[]
  readonly viewIndex: number
  readonly onSelectIndex: (index: number) => void
}

export function MoveHistoryPanel({ moves, viewIndex, onSelectIndex }: MoveHistoryPanelProps) {
  const labels = formatMoveList(moves)
  const atStart = viewIndex === 0
  const atEnd = viewIndex === moves.length

  return (
    <div className="move-history">
      <h3 className="move-history__title">기보</h3>
      <div className="move-history__nav">
        <button type="button" onClick={() => onSelectIndex(0)} disabled={atStart}>
          ⏮ 처음
        </button>
        <button type="button" onClick={() => onSelectIndex(viewIndex - 1)} disabled={atStart}>
          ◀ 이전
        </button>
        <button type="button" onClick={() => onSelectIndex(viewIndex + 1)} disabled={atEnd}>
          다음 ▶
        </button>
        <button type="button" onClick={() => onSelectIndex(moves.length)} disabled={atEnd}>
          마지막 ⏭
        </button>
      </div>
      <ol className="move-history__list">
        <li>
          <button type="button" className={atStart ? 'is-active' : ''} onClick={() => onSelectIndex(0)}>
            (시작 국면)
          </button>
        </li>
        {labels.map((label, i) => (
          <li key={i}>
            <button type="button" className={viewIndex === i + 1 ? 'is-active' : ''} onClick={() => onSelectIndex(i + 1)}>
              {label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
