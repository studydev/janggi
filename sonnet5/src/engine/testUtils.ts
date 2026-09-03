// 테스트 전용 보드 생성 헬퍼. 프로덕션 코드에서는 사용하지 않는다.
import { DEFAULT_CONFIG, FILES, positionKey, RANKS, toIndex } from './board'
import type { Board, GameConfig, GameState, Piece, Position, Side } from './types'

export function pos(file: number, rank: number): Position {
  return { file, rank }
}

export function emptyBoard(): (Piece | null)[] {
  return new Array(FILES * RANKS).fill(null)
}

export function withPieces(pieces: ReadonlyArray<readonly [Position, Piece]>): Board {
  const board = emptyBoard()
  for (const [p, piece] of pieces) board[toIndex(p)] = piece
  return board
}

export function hasPos(list: readonly Position[], p: Position): boolean {
  return list.some((item) => item.file === p.file && item.rank === p.rank)
}

export function makeState(board: Board, turn: Side, config: GameConfig = DEFAULT_CONFIG): GameState {
  return {
    board,
    turn,
    moveHistory: [],
    capturedPieces: { HAN: [], CHO: [] },
    config,
    positionCounts: { [positionKey(board, turn)]: 1 },
  }
}
