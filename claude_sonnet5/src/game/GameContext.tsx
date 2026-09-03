/**
 * 세션 Context — useReducer 로 관리, 변경 시 localStorage 자동 저장.
 * Provider 와 그에 딸린 훅을 한 파일에 두는 관용적 구성이라 fast-refresh 규칙은 끈다.
 */
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { getGameResult } from '../engine/result'
import type { GameState } from '../engine/types'
import { gameReducer, initialSession, viewedGame, type Action } from './gameReducer'
import { effectiveResult, type DisplayResult, type Session } from './session-types'
import { clearSavedSession, saveSession } from './storage'

const SessionCtx = createContext<Session | null>(null)
const DispatchCtx = createContext<Dispatch<Action> | null>(null)

export function GameProvider({
  children,
  initial,
}: {
  children: ReactNode
  initial?: Session
}) {
  const [session, dispatch] = useReducer(gameReducer, initial ?? null, (s) => s ?? initialSession())

  useEffect(() => {
    if (session.phase === 'playing') {
      saveSession(session)
    } else {
      clearSavedSession()
    }
  }, [session])

  return (
    <SessionCtx.Provider value={session}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </SessionCtx.Provider>
  )
}

export function useSession(): Session {
  const ctx = useContext(SessionCtx)
  if (ctx === null) throw new Error('useSession must be used within <GameProvider>')
  return ctx
}

export function useGameDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchCtx)
  if (ctx === null) throw new Error('useGameDispatch must be used within <GameProvider>')
  return ctx
}

/** 현재 대국의 판정 결과 (수동 종료 반영). */
export function useGameResult(): DisplayResult {
  const session = useSession()
  return useMemo(() => effectiveResult(session, getGameResult(session.game)), [session])
}

/** 화면에 그릴 국면 (리플레이 중이면 과거). */
export function useViewedGame(): GameState {
  const session = useSession()
  return useMemo(() => viewedGame(session), [session])
}
