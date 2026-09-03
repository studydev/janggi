/**
 * UI 세션 상태 타입. 엔진 GameState 를 감싸 화면 흐름·선택·리플레이·수동 결과
 * (기권/무승부 합의)를 관리한다. 규칙 판단은 하지 않는다.
 */

import type { GameResult } from '../engine/result'
import type { Formation, GameState, Position, Side } from '../engine/types'

export type GameMode = 'LOCAL_2P'

export type SessionPhase = 'setup' | 'playing'

export interface PieceStyleOptions {
  /** 기물 표기: 한자(車) vs 한글(차). */
  script: 'hanja' | 'hangul'
  /** 색맹 대응 팔레트. */
  colorblind: boolean
  /** 내 진영(초)을 항상 아래로 두도록 보드를 뒤집을지. */
  flipToActive: boolean
  /** 이동 애니메이션 (prefers-reduced-motion 이면 무시). */
  animate: boolean
  /** 이동 가능 지점 표시. */
  showHints: boolean
}

export const DEFAULT_STYLE_OPTIONS: PieceStyleOptions = {
  script: 'hanja',
  colorblind: false,
  flipToActive: false,
  animate: true,
  showHints: true,
}

/** 엔진으로는 도출할 수 없는 수동 종료 (기권 / 무승부 합의). */
export interface ManualOutcome {
  readonly status: 'RESIGN' | 'DRAW_AGREED'
  readonly winner: Side | null
  readonly reason: string
}

export interface ReplayState {
  readonly active: boolean
  /** 0 = 초기 국면, N = N수 이후. */
  readonly ply: number
}

export interface SetupChoices {
  hanFormation: Formation
  choFormation: Formation
  mode: GameMode
  bikjangDraw: boolean
  repetitionLimit: number
}

export const DEFAULT_SETUP: SetupChoices = {
  hanFormation: 'MSMS',
  choFormation: 'MSMS',
  mode: 'LOCAL_2P',
  bikjangDraw: true,
  repetitionLimit: 3,
}

export interface Session {
  phase: SessionPhase
  mode: GameMode
  /** 엔진 상태 — 유일한 게임 진실. */
  game: GameState
  /** 현재 선택된 기물 위치. */
  selected: Position | null
  /** selected 기물의 합법 도착 지점 (엔진 계산 결과 캐시). */
  legalTargets: Position[]
  /** 수동 종료. null 이면 getGameResult(game) 이 결과. */
  manualOutcome: ManualOutcome | null
  /** 무승부를 제안한 쪽. */
  drawOfferedBy: Side | null
  /** 리플레이 모드. */
  replay: ReplayState
  options: PieceStyleOptions
  /** 대국 시작 시각 (경과 시간 표시용). */
  startedAt: number
  /** 마지막 착수 시각 (자동 저장 갱신 트리거). */
  updatedAt: number
}

export type OutcomeStatus = GameResult['status'] | ManualOutcome['status']

export interface DisplayResult {
  readonly status: OutcomeStatus
  readonly winner: Side | null
  readonly reason: string
  readonly scores: Readonly<Record<Side, number>>
}

/** 화면에 실제로 보여줄 결과 (수동 종료가 우선). */
export function effectiveResult(session: Session, engineResult: GameResult): DisplayResult {
  if (session.manualOutcome !== null) {
    return { ...session.manualOutcome, scores: engineResult.scores }
  }
  return engineResult
}

export function isGameOver(result: DisplayResult): boolean {
  return result.status !== 'PLAYING'
}
