/**
 * 세션 리듀서. **엔진 함수만 호출한다** (규칙 판단을 여기 두지 않는다).
 */

import { createInitialState, pieceAt, posEquals } from '../engine/board'
import { getGameResult } from '../engine/result'
import { generateLegalMoves, makeMove, pass, replayHistory, undoMove } from '../engine/rules'
import type { GameState, Position, Side } from '../engine/types'
import {
  DEFAULT_STYLE_OPTIONS,
  type ManualOutcome,
  type PieceStyleOptions,
  type Session,
  type SetupChoices,
} from './session-types'

export type Action =
  | { type: 'NEW_GAME'; choices: SetupChoices }
  | { type: 'RESET_TO_SETUP' }
  | { type: 'SQUARE_CLICK'; pos: Position }
  | { type: 'DRAG_MOVE'; from: Position; to: Position }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'PASS' }
  | { type: 'UNDO' }
  | { type: 'RESIGN'; side: Side }
  | { type: 'OFFER_DRAW'; side: Side }
  | { type: 'RESPOND_DRAW'; accept: boolean }
  | { type: 'REPLAY_ENTER' }
  | { type: 'REPLAY_EXIT' }
  | { type: 'REPLAY_SEEK'; ply: number }
  | { type: 'REPLAY_STEP'; delta: number }
  | { type: 'SET_OPTIONS'; options: Partial<PieceStyleOptions> }
  | { type: 'LOAD_SESSION'; session: Session }

function targetsFrom(game: GameState, from: Position): Position[] {
  return generateLegalMoves(game)
    .filter((m) => m.from !== null && posEquals(m.from, from))
    .map((m) => m.to!)
}

export function createSession(choices: SetupChoices, options = DEFAULT_STYLE_OPTIONS): Session {
  const now = Date.now()
  return {
    phase: 'playing',
    mode: choices.mode,
    game: createInitialState({
      hanFormation: choices.hanFormation,
      choFormation: choices.choFormation,
      bikjangDraw: choices.bikjangDraw,
      repetitionLimit: choices.repetitionLimit,
    }),
    selected: null,
    legalTargets: [],
    manualOutcome: null,
    drawOfferedBy: null,
    replay: { active: false, ply: 0 },
    options,
    startedAt: now,
    updatedAt: now,
  }
}

export function initialSession(): Session {
  return {
    ...createSession({
      hanFormation: 'MSMS',
      choFormation: 'MSMS',
      mode: 'LOCAL_2P',
      bikjangDraw: true,
      repetitionLimit: 3,
    }),
    phase: 'setup',
  }
}

/** 현재 화면에 그릴 국면 (리플레이 중이면 과거 국면). */
export function viewedGame(session: Session): GameState {
  if (session.replay.active) {
    return replayHistory(session.game.config, session.game.moveHistory.slice(0, session.replay.ply))
  }
  return session.game
}

function gameOver(session: Session): boolean {
  return session.manualOutcome !== null || getGameResult(session.game).status !== 'PLAYING'
}

function commitMove(session: Session, from: Position, to: Position): Session {
  let nextGame: GameState
  try {
    nextGame = makeMove(session.game, from, to)
  } catch {
    return { ...session, selected: null, legalTargets: [] } // 비합법 — 선택만 해제.
  }
  return {
    ...session,
    game: nextGame,
    selected: null,
    legalTargets: [],
    drawOfferedBy: null,
    updatedAt: Date.now(),
  }
}

export function gameReducer(session: Session, action: Action): Session {
  switch (action.type) {
    case 'NEW_GAME':
      return createSession(action.choices, session.options)

    case 'RESET_TO_SETUP':
      return { ...initialSession(), options: session.options }

    case 'LOAD_SESSION':
      return action.session

    case 'SET_OPTIONS':
      return { ...session, options: { ...session.options, ...action.options } }

    case 'CLEAR_SELECTION':
      return { ...session, selected: null, legalTargets: [] }

    case 'SQUARE_CLICK': {
      if (session.replay.active || gameOver(session)) return session
      const { pos } = action
      // 1) 선택된 기물이 있고 클릭 지점이 합법 도착지 → 착수.
      if (session.selected !== null && session.legalTargets.some((t) => posEquals(t, pos))) {
        return commitMove(session, session.selected, pos)
      }
      // 2) 클릭 지점에 현재 차례 기물 → 선택.
      const piece = pieceAt(session.game.board, pos)
      if (piece !== null && piece.side === session.game.turn) {
        return { ...session, selected: pos, legalTargets: targetsFrom(session.game, pos) }
      }
      // 3) 그 외 → 선택 해제.
      return { ...session, selected: null, legalTargets: [] }
    }

    case 'DRAG_MOVE': {
      if (session.replay.active || gameOver(session)) return session
      const { from, to } = action
      const piece = pieceAt(session.game.board, from)
      if (piece === null || piece.side !== session.game.turn) return session
      const legal = targetsFrom(session.game, from)
      if (!legal.some((t) => posEquals(t, to))) {
        return { ...session, selected: from, legalTargets: legal }
      }
      return commitMove(session, from, to)
    }

    case 'PASS': {
      if (session.replay.active || gameOver(session)) return session
      try {
        return {
          ...session,
          game: pass(session.game),
          selected: null,
          legalTargets: [],
          drawOfferedBy: null,
          updatedAt: Date.now(),
        }
      } catch {
        return session // 장군 중 — 쉴 수 없음.
      }
    }

    case 'UNDO': {
      if (session.replay.active) return session
      if (session.game.moveHistory.length === 0) return session
      return {
        ...session,
        game: undoMove(session.game),
        selected: null,
        legalTargets: [],
        manualOutcome: null,
        drawOfferedBy: null,
        updatedAt: Date.now(),
      }
    }

    case 'RESIGN': {
      if (gameOver(session)) return session
      const outcome: ManualOutcome = {
        status: 'RESIGN',
        winner: action.side === 'CHO' ? 'HAN' : 'CHO',
        reason: `${action.side === 'CHO' ? '초' : '한'} 기권`,
      }
      return { ...session, manualOutcome: outcome, selected: null, legalTargets: [], updatedAt: Date.now() }
    }

    case 'OFFER_DRAW':
      if (gameOver(session)) return session
      return { ...session, drawOfferedBy: action.side }

    case 'RESPOND_DRAW': {
      if (session.drawOfferedBy === null) return session
      if (!action.accept) return { ...session, drawOfferedBy: null }
      const outcome: ManualOutcome = { status: 'DRAW_AGREED', winner: null, reason: '합의 무승부' }
      return { ...session, manualOutcome: outcome, drawOfferedBy: null, updatedAt: Date.now() }
    }

    case 'REPLAY_ENTER':
      return {
        ...session,
        replay: { active: true, ply: session.game.moveHistory.length },
        selected: null,
        legalTargets: [],
      }

    case 'REPLAY_EXIT':
      return { ...session, replay: { active: false, ply: session.game.moveHistory.length } }

    case 'REPLAY_SEEK':
      return {
        ...session,
        replay: {
          active: true,
          ply: Math.max(0, Math.min(action.ply, session.game.moveHistory.length)),
        },
      }

    case 'REPLAY_STEP':
      return {
        ...session,
        replay: {
          active: true,
          ply: Math.max(
            0,
            Math.min(session.replay.ply + action.delta, session.game.moveHistory.length),
          ),
        },
      }
  }
}
