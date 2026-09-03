// 대국 종료 모달: 외통/빅장/반복/기권/합의무승부 사유와 최종 점수를 보여준다.
import { opponent, SIDE_NAME_KO } from '../engine'
import type { Side } from '../engine'
import type { EndReason } from '../state/gameReducer'

export interface EndGameDialogProps {
  readonly endReason: EndReason
  readonly hanScore: number
  readonly choScore: number
  readonly onNewGame: () => void
}

function statusTitle(status: string): string {
  switch (status) {
    case 'CHECKMATE':
      return '외통(체크메이트)'
    case 'DRAW_BY_BIKJANG':
      return '빅장'
    case 'DRAW_BY_REPETITION':
      return '동일 국면 반복'
    default:
      return '대국 종료'
  }
}

function describe(endReason: EndReason): { title: string; detail: string; winner: Side | null } {
  if (endReason.kind === 'ENGINE') {
    return { title: statusTitle(endReason.result.status), detail: endReason.result.reason, winner: endReason.result.winner }
  }
  if (endReason.kind === 'RESIGNATION') {
    return { title: '기권', detail: `${SIDE_NAME_KO[opponent(endReason.winner)]}이 기권했습니다.`, winner: endReason.winner }
  }
  return { title: '합의 무승부', detail: '두 진영이 무승부에 합의했습니다.', winner: null }
}

export function EndGameDialog({ endReason, hanScore, choScore, onNewGame }: EndGameDialogProps) {
  const { title, detail, winner } = describe(endReason)
  return (
    <div className="end-dialog__backdrop">
      <div className="end-dialog" role="dialog" aria-modal="true" aria-labelledby="end-dialog-title">
        <h2 id="end-dialog-title">{title}</h2>
        <p>{detail}</p>
        <p className="end-dialog__winner">{winner ? `${SIDE_NAME_KO[winner]} 승리` : '무승부'}</p>
        <p className="end-dialog__score">
          한 {hanScore}점 : 초 {choScore}점
        </p>
        <button type="button" className="end-dialog__new-game" onClick={onNewGame} autoFocus>
          새 게임
        </button>
      </div>
    </div>
  )
}
