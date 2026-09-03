import { useEffect, useRef, useState } from 'react'
import {
  calculateScore,
  deserializeGame,
  formatMoveNotation,
  getGameResult,
  isCheck,
  pieceName,
  serializeGame,
  type GameResult,
  type GameState,
  type GameStatus,
  type MoveRecord,
  type Side,
} from '../engine'
import { Board } from './Board'
import { useGame } from './useGame'

function sideName(side: Side): string {
  return side === 'HAN' ? '한' : '초'
}

function formatElapsed(startedAt: number | null): string {
  if (startedAt === null) return '00:00'
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
  return `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`
}

function downloadRecord(game: GameState): void {
  const blob = new Blob([serializeGame(game)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `luna-janggi-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function useElapsed(startedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  void now
  return formatElapsed(startedAt)
}

function statusLabel(status: GameStatus): string {
  if (status === 'CHECKMATE') return '외통'
  if (status === 'DRAW_BY_SCORE') return '점수 판정'
  if (status === 'DRAW_BY_BIKJANG') return '빅장'
  if (status === 'DRAW_BY_REPETITION') return '반복'
  return '진행 중'
}

function terminalCopy(
  result: GameResult,
  resignedBy: Side | null,
  drawAccepted: boolean,
): { title: string; detail: string } {
  if (resignedBy !== null) return { title: `${sideName(resignedBy)} 기권`, detail: `${sideName(resignedBy === 'HAN' ? 'CHO' : 'HAN')} 승리` }
  if (drawAccepted) return { title: '무승부 합의', detail: '양쪽이 대국을 마쳤습니다.' }
  if (result.status === 'CHECKMATE') return { title: '외통', detail: `${sideName(result.winner ?? 'HAN')} 승리` }
  if (result.status === 'DRAW_BY_SCORE') {
    return result.winner === null
      ? { title: '동점 무승부', detail: '두 진영의 점수가 같습니다.' }
      : { title: '점수 판정', detail: `${sideName(result.winner)} 승리` }
  }
  if (result.status === 'DRAW_BY_BIKJANG') return { title: '빅장', detail: result.winner === null ? '동점 무승부' : `${sideName(result.winner)} 승리` }
  if (result.status === 'DRAW_BY_REPETITION') return { title: '국면 반복', detail: result.winner === null ? '동점 무승부' : `${sideName(result.winner)} 승리` }
  return { title: statusLabel(result.status), detail: result.reason }
}

function MoveRow({ move, index, active, korean, onSelect }: { readonly move: MoveRecord; readonly index: number; readonly active: boolean; readonly korean: boolean; readonly onSelect: () => void }) {
  return (
    <button className={`move-row${active ? ' is-active' : ''}`} type="button" onClick={onSelect}>
      <span className="move-number">{String(index + 1).padStart(2, '0')}</span>
      <span className="move-side">{move.isPass ? '·' : sideName(move.piece.side)}</span>
      <span className="move-notation">{formatMoveNotation(move, korean)}</span>
      <span className="move-chevron" aria-hidden="true">›</span>
    </button>
  )
}

function PlayerCard({ side, score, isTurn, captures, korean }: { readonly side: Side; readonly score: number; readonly isTurn: boolean; readonly captures: ReadonlyArray<import('../engine').Piece>; readonly korean: boolean }) {
  return (
    <section className={`player-card player-${side.toLowerCase()}${isTurn ? ' is-turn' : ''}`}>
      <div className="player-card-top"><span className="side-pip" /><span className="player-role">{side === 'CHO' ? '선수' : '후수'}</span>{isTurn && <span className="turn-live">착수</span>}</div>
      <div className="player-card-main"><div><h3>{sideName(side)}</h3><p>{side === 'CHO' ? '楚 · 먼저 둡니다' : '漢 · 덤 1.5'}</p></div><strong className="score-value">{score.toFixed(score % 1 === 0 ? 0 : 1)}<small>점</small></strong></div>
      <div className="captured-line"><span>잡은 기물</span><div className="captured-pieces" aria-label={`${sideName(side)}이 잡은 기물`}>
        {captures.length === 0 ? <span className="no-captures">없음</span> : captures.map((piece) => <span key={piece.id} title={pieceName(piece, korean)}>{pieceName(piece, korean)}</span>)}
      </div></div>
    </section>
  )
}

export function GameScreen() {
  const { state, liveGame, viewGame, dispatch } = useGame()
  const [showResult, setShowResult] = useState(true)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const elapsed = useElapsed(state.startedAt)
  if (liveGame === null || viewGame === null) return null

  const liveResult = getGameResult(liveGame)
  const viewResult = getGameResult(viewGame)
  const isReplay = state.replayIndex !== null
  const finished = state.resignedBy !== null || state.drawAccepted || liveResult.status !== 'PLAYING'
  const finalCopy = terminalCopy(liveResult, state.resignedBy, state.drawAccepted)
  const currentMove = liveGame.moveHistory.length
  const replayIndex = state.replayIndex ?? currentMove

  const handleImport = async (file: File | undefined) => {
    if (file === undefined) return
    try {
      const serializedGame = await file.text()
      deserializeGame(serializedGame)
      dispatch({ type: 'IMPORT_GAME', serializedGame })
      setImportError(null)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '기보 파일을 불러오지 못했습니다.')
    }
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <button className="brand-button" type="button" onClick={() => dispatch({ type: 'BACK_TO_SETUP' })}><span className="brand-mark small-mark">將</span><span>장기</span></button>
        <div className="header-center"><span className="eyebrow">LOCAL TABLE</span><span className={`header-status ${finished ? 'is-finished' : ''}`}>{isReplay ? '기보 재생' : finished ? '대국 종료' : `${sideName(liveGame.turn)} 차례`}</span></div>
        <div className="header-actions"><span className="elapsed"><span className="elapsed-dot" />{elapsed}</span><button className="icon-button" type="button" aria-label="설정으로 돌아가기" title="설정으로" onClick={() => dispatch({ type: 'BACK_TO_SETUP' })}>⌂</button></div>
      </header>

      <div className="game-layout">
        <section className="board-column" aria-label="대국 보드 영역">
          <div className="board-meta"><div><span className="eyebrow">TURN {String(liveGame.moveHistory.length + 1).padStart(2, '0')}</span><h1>{isReplay ? `${replayIndex}수째 장면` : `${sideName(liveGame.turn)}의 차례`}</h1></div><div className="board-meta-right"><span className={`check-indicator${isCheck(viewGame, viewGame.turn) ? ' is-check' : ''}`}>{isCheck(viewGame, viewGame.turn) ? '장군' : statusLabel(viewResult.status)}</span><span className="board-coordinates-label">9 × 10 POINTS</span></div></div>
          <div className="board-frame"><Board board={viewGame.board} selected={isReplay ? null : state.selected} legalMoves={isReplay ? [] : state.selectedMoves} lastMove={viewGame.moveHistory[viewGame.moveHistory.length - 1] ?? null} checkedSide={isCheck(viewGame, 'HAN') ? 'HAN' : isCheck(viewGame, 'CHO') ? 'CHO' : null} flipped={state.flipped} displayKorean={state.displayKorean} interactive={!isReplay && !finished} onPositionClick={(position) => dispatch({ type: 'SELECT_POSITION', position })} /></div>
          <div className="board-tools"><div className="tool-group"><button className="tool-button" type="button" onClick={() => dispatch({ type: 'TOGGLE_FLIP' })}><span aria-hidden="true">⇄</span> 보드 뒤집기</button><button className="tool-button" type="button" onClick={() => dispatch({ type: 'TOGGLE_LANGUAGE' })}><span aria-hidden="true">文</span> {state.displayKorean ? '한자 보기' : '한글 보기'}</button></div><span className="board-hint">기물을 선택하고 점으로 표시된 곳을 누르세요</span></div>
        </section>

        <aside className="game-sidebar">
          <div className="players-stack"><PlayerCard side="CHO" score={calculateScore(liveGame, 'CHO')} isTurn={!isReplay && liveGame.turn === 'CHO' && !finished} captures={liveGame.capturedPieces.CHO} korean={state.displayKorean} /><PlayerCard side="HAN" score={calculateScore(liveGame, 'HAN')} isTurn={!isReplay && liveGame.turn === 'HAN' && !finished} captures={liveGame.capturedPieces.HAN} korean={state.displayKorean} /></div>

          {state.drawOffer !== null && !state.drawAccepted && !finished && <div className="draw-notice"><div><span className="notice-kicker">DRAW OFFER</span><strong>{sideName(state.drawOffer)}이 무승부를 제안했습니다.</strong></div><button className="mini-button" type="button" onClick={() => dispatch({ type: 'ACCEPT_DRAW' })}>수락</button></div>}

          <section className="record-panel">
            <div className="panel-heading"><div><span className="eyebrow">MATCH RECORD</span><h2>기보</h2></div><span className="record-count">{liveGame.moveHistory.length}수</span></div>
            <div className="move-list">{liveGame.moveHistory.length === 0 ? <div className="empty-record"><span className="empty-glyph">○</span><p>첫 수를 기다리는 중</p><small>보드에서 기물을 선택하세요</small></div> : liveGame.moveHistory.map((move, index) => <MoveRow key={`${index}-${move.isPass ? 'pass' : move.piece.id}`} move={move} index={index} active={replayIndex === index + 1} korean={state.displayKorean} onSelect={() => dispatch({ type: 'REPLAY', index: index + 1 })} />)}</div>
            <div className="replay-controls"><button type="button" aria-label="처음으로" title="처음으로" disabled={liveGame.moveHistory.length === 0} onClick={() => dispatch({ type: 'REPLAY', index: 0 })}>↤</button><button type="button" aria-label="이전 수" title="이전 수" disabled={replayIndex === 0} onClick={() => dispatch({ type: 'REPLAY', index: Math.max(0, replayIndex - 1) })}>‹</button><span>{replayIndex} / {currentMove}</span><button type="button" aria-label="다음 수" title="다음 수" disabled={replayIndex >= currentMove} onClick={() => dispatch({ type: 'REPLAY', index: Math.min(currentMove, replayIndex + 1) })}>›</button><button type="button" aria-label="마지막으로" title="마지막으로" disabled={liveGame.moveHistory.length === 0} onClick={() => dispatch({ type: 'REPLAY', index: currentMove })}>↦</button></div>
            {isReplay && <button className="resume-button" type="button" onClick={() => dispatch({ type: 'EXIT_REPLAY' })}>실전으로 돌아가기</button>}
            <div className="record-actions"><button className="tool-button" type="button" onClick={() => downloadRecord(liveGame)}><span aria-hidden="true">↧</span> 기보 저장</button><button className="tool-button" type="button" onClick={() => fileInputRef.current?.click()}><span aria-hidden="true">↥</span> 기보 불러오기</button><input ref={fileInputRef} className="file-input" type="file" accept="application/json,.json" aria-label="기보 JSON 파일 선택" onChange={(event) => { void handleImport(event.target.files?.[0]); event.target.value = '' }} /></div>
            {importError !== null && <p className="import-error" role="alert">{importError}</p>}
          </section>

          <div className="action-panel"><div className="action-row"><button className="secondary-action" type="button" disabled={isReplay || state.past.length === 0 || finished} onClick={() => dispatch({ type: 'UNDO' })}><span aria-hidden="true">↶</span> 무르기</button><button className="secondary-action" type="button" disabled={isReplay || finished || isCheck(liveGame, liveGame.turn)} onClick={() => dispatch({ type: 'PASS' })}><span aria-hidden="true">—</span> 한 수 쉬기</button></div><div className="action-row"><button className="secondary-action" type="button" disabled={isReplay || finished} onClick={() => dispatch({ type: 'OFFER_DRAW' })}><span aria-hidden="true">◌</span>{state.drawOffer !== null && state.drawOffer !== liveGame.turn ? ' 무승부 수락' : ' 무승부 제안'}</button><button className="resign-action" type="button" disabled={isReplay || finished} onClick={() => dispatch({ type: 'RESIGN' })}><span aria-hidden="true">⚑</span> 기권</button></div></div>
        </aside>
      </div>

      {finished && !isReplay && showResult && <div className="result-overlay" role="presentation"><section className="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title"><button className="dialog-close" type="button" aria-label="닫기" onClick={() => setShowResult(false)}>×</button><span className="result-kicker">MATCH COMPLETE</span><h2 id="result-title">{finalCopy.title}</h2><p>{finalCopy.detail}</p><div className="result-scores"><div><span>초</span><strong>{calculateScore(liveGame, 'CHO').toFixed(1)}</strong></div><div><span>한</span><strong>{calculateScore(liveGame, 'HAN').toFixed(1)}</strong></div></div><button className="start-button compact-start" type="button" onClick={() => dispatch({ type: 'BACK_TO_SETUP' })}><span>새 대국</span><span aria-hidden="true">↗</span></button></section></div>}
    </main>
  )
}