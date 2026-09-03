// 졸/병(卒/兵): 앞 또는 좌우로 1칸, 뒤로는 불가. 상대 궁성 대각선 위에서는 대각 전진 가능.
import { forwardDir, isInBoard, isInPalace, opponent, pieceAt } from '../board'
import { getPalaceDiagonalRays } from '../board'
import type { Board, Position } from '../types'

export function generateJolMoves(board: Board, pos: Position): Position[] {
  const piece = pieceAt(board, pos)
  if (!piece) return []
  const fwd = forwardDir(piece.side)
  const moves: Position[] = []

  const candidates: Position[] = [
    { file: pos.file, rank: pos.rank + fwd },
    { file: pos.file - 1, rank: pos.rank },
    { file: pos.file + 1, rank: pos.rank },
  ]
  for (const dest of candidates) {
    if (!isInBoard(dest)) continue
    const target = pieceAt(board, dest)
    if (target && target.side === piece.side) continue
    moves.push(dest)
  }

  if (isInPalace(pos, opponent(piece.side))) {
    for (const ray of getPalaceDiagonalRays(pos)) {
      const dest = ray[0]
      if (!dest) continue
      if ((dest.rank - pos.rank) * fwd <= 0) continue // 전진 방향의 대각선만 허용
      const target = pieceAt(board, dest)
      if (target && target.side === piece.side) continue
      moves.push(dest)
    }
  }

  return moves
}
