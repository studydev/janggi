// 잡힌 기물 트레이. Board와 별개로 작은 SVG 아이콘을 나열해서 보여준다.
import { SIDE_NAME_KO } from '../engine'
import type { Piece, PieceScript, Side } from '../engine'
import './pieces.css'
import { PieceGlyph } from './PieceGlyph'

export interface CapturedPiecesProps {
  readonly side: Side
  readonly pieces: readonly Piece[]
  readonly script: PieceScript
}

export function CapturedPieces({ side, pieces, script }: CapturedPiecesProps) {
  return (
    <div className="captured-pieces">
      <span className="captured-pieces__label">{SIDE_NAME_KO[side]} 잡힌 기물</span>
      <div className="captured-pieces__tray" aria-label={`${SIDE_NAME_KO[side]}이 잡힌 기물 목록`}>
        {pieces.length === 0 && <span className="captured-pieces__empty">없음</span>}
        {pieces.map((p, i) => (
          <svg key={i} viewBox="0 0 40 40" width={26} height={26} className="captured-pieces__item">
            <g transform="translate(20,20)">
              <PieceGlyph piece={p} script={script} radius={17} />
            </g>
          </svg>
        ))}
      </div>
    </div>
  )
}
