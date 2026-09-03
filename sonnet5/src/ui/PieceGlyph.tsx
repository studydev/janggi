// 기물 원형 그래픽. Board(교차점 위)와 CapturedPieces(잡힌 기물 트레이) 양쪽에서 재사용한다.
// 규칙을 전혀 모르는 순수 표시 컴포넌트.
import { pieceLabel } from '../engine'
import type { Piece, PieceScript } from '../engine'

export interface PieceGlyphProps {
  readonly piece: Piece
  readonly script: PieceScript
  readonly radius?: number
}

export function PieceGlyph({ piece, script, radius = 26 }: PieceGlyphProps) {
  const label = pieceLabel(piece, script)
  const sideClass = piece.side === 'HAN' ? 'piece-glyph--han' : 'piece-glyph--cho'
  return (
    <g className={`piece-glyph ${sideClass}`}>
      <circle r={radius} className="piece-glyph__disc" />
      <circle r={radius - 4} className="piece-glyph__ring" />
      <text className="piece-glyph__label" fontSize={radius * 1.15} textAnchor="middle" dominantBaseline="central">
        {label}
      </text>
    </g>
  )
}
