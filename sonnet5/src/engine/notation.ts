// 기보 표기 규칙을 이 파일 한 곳에서만 관리한다. 다른 곳에서 직접 문자열을 만들지 않는다.
import { pieceLabel, SIDE_NAME_KO } from './pieceLabels'
import type { Move, Position } from './types'

function posLabel(pos: Position): string {
  return `${pos.file}${pos.rank.toString().padStart(2, '0')}`
}

export function formatMove(move: Move): string {
  const sideName = SIDE_NAME_KO[move.piece.side]
  if (move.isPass) return `${sideName} 한 수 쉬기`
  const label = pieceLabel(move.piece, 'HANGUL')
  const captureText = move.captured ? ` (${SIDE_NAME_KO[move.captured.side]}${pieceLabel(move.captured, 'HANGUL')} 잡음)` : ''
  return `${sideName}${label} ${posLabel(move.from)}→${posLabel(move.to)}${captureText}`
}

export function formatMoveList(moves: readonly Move[]): string[] {
  return moves.map((move, i) => `${i + 1}. ${formatMove(move)}`)
}
