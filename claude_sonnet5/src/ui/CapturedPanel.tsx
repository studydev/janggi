import type { Piece, Side } from '../engine/types'
import { PIECE_VALUE } from '../engine/types'
import { pieceGlyph, sideLabel } from './pieceLabels'

/** capturedPieces 는 "잡힌" 기물 목록이므로 piece.side 가 잃은 쪽. */
export function CapturedPanel({
  captured,
  script,
  colorblind,
}: {
  captured: readonly Piece[]
  script: 'hanja' | 'hangul'
  colorblind: boolean
}) {
  const lostBy = (side: Side) =>
    captured
      .filter((p) => p.side === side)
      .sort((a, b) => PIECE_VALUE[b.type] - PIECE_VALUE[a.type])

  return (
    <section className="panel captured-panel" aria-label="잡힌 기물">
      <h2 className="panel-title">잡힌 기물</h2>
      {(['CHO', 'HAN'] as const).map((side) => {
        const pieces = lostBy(side)
        return (
          <div key={side} className="captured-row">
            <span className="captured-label">{sideLabel(side)} 손실</span>
            <span className="captured-list">
              {pieces.length === 0 ? (
                <span className="captured-empty">—</span>
              ) : (
                pieces.map((p, i) => (
                  <span
                    key={i}
                    className={`captured-piece captured-${side.toLowerCase()}${colorblind ? ' cb' : ''}`}
                    title={`${sideLabel(p.side)} ${pieceGlyph(p.side, p.type, 'hangul')}`}
                  >
                    {pieceGlyph(p.side, p.type, script)}
                  </span>
                ))
              )}
            </span>
          </div>
        )
      })}
    </section>
  )
}
