/**
 * 규칙 엔진 불변식 검증.
 *
 * 랜덤 대국을 여러 판 돌리면서 RULES.md 를 어기는 상황이 한 번이라도 나오면
 * 실패로 기록한다:
 *  - 궁이 실제로 잡힘
 *  - 기물이 보드 밖으로 나감
 *  - 사/궁이 궁성을 벗어남
 *  - 포가 포를 넘거나 잡음
 *  - 졸/병이 뒤로 이동
 *  - makeMove -> undo 가 원래 국면과 불일치
 */

import { createInitialState, forwardDir, isInBoard, isInPalace } from './board'
import { getGameResult } from './result'
import { applyMove, generateLegalMoves, isCheck, replayHistory, undoMove } from './rules'
import type { GameState, Move } from './types'

// --- 시드 기반 RNG (mulberry32) — 재현 가능한 랜덤 대국용 -------------------

export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// --- 불변식 위반 ---------------------------------------------------------

export interface Violation {
  readonly kind: string
  readonly detail: string
}

function checkMoveShape(move: Move): Violation[] {
  const v: Violation[] = []
  if (move.isPass) return v

  const { from, to, piece, captured } = move
  if (from === null || to === null || piece === null) {
    return [{ kind: 'incomplete-move', detail: JSON.stringify(move) }]
  }
  if (!isInBoard(from) || !isInBoard(to)) {
    v.push({ kind: 'off-board', detail: `${from.file},${from.rank} -> ${to.file},${to.rank}` })
  }
  if ((piece.type === 'SA' || piece.type === 'GUNG') && !isInPalace(to, piece.side)) {
    v.push({ kind: 'palace-escape', detail: `${piece.side} ${piece.type} -> ${to.file},${to.rank}` })
  }
  if (piece.type === 'JOL') {
    const backward = -forwardDir(piece.side)
    if (to.rank !== from.rank && Math.sign(to.rank - from.rank) === backward) {
      v.push({ kind: 'jol-backward', detail: `${piece.side} JOL rank ${from.rank} -> ${to.rank}` })
    }
  }
  if (captured !== null && captured.type === 'GUNG') {
    v.push({ kind: 'gung-captured', detail: `${captured.side} GUNG at ${to.file},${to.rank}` })
  }
  if (piece.type === 'PO' && captured !== null && captured.type === 'PO') {
    v.push({ kind: 'po-captures-po', detail: `${from.file},${from.rank} -> ${to.file},${to.rank}` })
  }
  return v
}

function checkBoardInvariants(state: GameState): Violation[] {
  const v: Violation[] = []
  for (let i = 0; i < state.board.length; i += 1) {
    const p = state.board[i]
    if (p === null) continue
    const pos = { file: (i % 9) + 1, rank: Math.floor(i / 9) + 1 }
    if ((p.type === 'SA' || p.type === 'GUNG') && !isInPalace(pos, p.side)) {
      v.push({ kind: 'palace-escape-static', detail: `${p.side} ${p.type} at ${pos.file},${pos.rank}` })
    }
  }
  for (const side of ['CHO', 'HAN'] as const) {
    const gungs = state.board.filter((c) => c?.side === side && c.type === 'GUNG').length
    if (gungs !== 1) v.push({ kind: 'gung-count', detail: `${side} has ${gungs} GUNG` })
  }
  return v
}

// --- 랜덤 대국 ---------------------------------------------------------

const PASS: Move = { from: null, to: null, piece: null, captured: null, isPass: true }

export interface PlayoutResult {
  readonly seed: number
  readonly moves: number
  readonly ended: boolean
  readonly status: string
  readonly violations: Violation[]
}

export function runRandomGame(seed: number, maxMoves = 400): PlayoutResult {
  const rng = makeRng(seed)
  let state = createInitialState()
  const violations: Violation[] = []
  let ply = 0

  for (; ply < maxMoves; ply += 1) {
    const result = getGameResult(state)
    if (result.status !== 'PLAYING') {
      return { seed, moves: ply, ended: true, status: result.status, violations }
    }

    const legal = generateLegalMoves(state)
    if (legal.length === 0) {
      if (isCheck(state.board, state.turn)) {
        violations.push({ kind: 'unreported-checkmate', detail: `turn ${state.turn}` })
        return { seed, moves: ply, ended: true, status: 'CHECKMATE?', violations }
      }
      state = applyMove(state, PASS)
      continue
    }

    const move = legal[Math.floor(rng() * legal.length)]
    for (const violation of checkMoveShape(move)) violations.push(violation)

    const next = applyMove(state, move)
    for (const violation of checkBoardInvariants(next)) violations.push(violation)

    if (ply % 10 === 0) {
      const undone = undoMove(next)
      if (
        JSON.stringify(undone.board) !== JSON.stringify(state.board) ||
        undone.turn !== state.turn
      ) {
        violations.push({ kind: 'undo-mismatch', detail: `ply ${ply}` })
      }
    }

    state = next
  }

  return { seed, moves: ply, ended: false, status: 'MAXMOVES', violations }
}

export interface SuiteResult {
  readonly games: number
  readonly failures: PlayoutResult[]
  readonly endedByStatus: Record<string, number>
  readonly avgMoves: number
}

export function runRandomSuite(games: number, startSeed = 1): SuiteResult {
  const failures: PlayoutResult[] = []
  const endedByStatus: Record<string, number> = {}
  let totalMoves = 0

  for (let i = 0; i < games; i += 1) {
    const r = runRandomGame(startSeed + i)
    totalMoves += r.moves
    endedByStatus[r.status] = (endedByStatus[r.status] ?? 0) + 1
    if (r.violations.length > 0) failures.push(r)
  }

  return { games, failures, endedByStatus, avgMoves: totalMoves / games }
}

/** 전체 기보를 재생했을 때 현재 국면과 일치하는가. */
export function verifyReplayConsistency(state: GameState): boolean {
  const replayed = replayHistory(state.config, state.moveHistory)
  return (
    JSON.stringify(replayed.board) === JSON.stringify(state.board) && replayed.turn === state.turn
  )
}
