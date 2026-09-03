import { describe, expect, it } from 'vitest'
import { hasPos, pos, withPieces } from '../../testUtils'
import { generateJolMoves } from '../jol'

describe('generateJolMoves', () => {
  it('앞과 좌우로만 이동 가능하고 뒤로는 갈 수 없다(한)', () => {
    const p = pos(5, 5)
    const board = withPieces([[p, { type: 'JOL', side: 'HAN' }]])
    const moves = generateJolMoves(board, p)
    expect(moves).toHaveLength(3)
    expect(hasPos(moves, pos(5, 6))).toBe(true) // 전진(HAN은 rank 증가 방향)
    expect(hasPos(moves, pos(4, 5))).toBe(true)
    expect(hasPos(moves, pos(6, 5))).toBe(true)
    expect(hasPos(moves, pos(5, 4))).toBe(false) // 후퇴 금지
  })

  it('뒤로는 갈 수 없다(초, 반대 방향)', () => {
    const p = pos(5, 5)
    const board = withPieces([[p, { type: 'JOL', side: 'CHO' }]])
    const moves = generateJolMoves(board, p)
    expect(hasPos(moves, pos(5, 4))).toBe(true) // 전진(CHO는 rank 감소 방향)
    expect(hasPos(moves, pos(5, 6))).toBe(false) // 후퇴 금지
  })

  it('상대 궁성 대각선 위(전진 방향)에서는 대각으로 전진할 수 있다', () => {
    const p = pos(4, 8) // 초 궁성 귀퉁이(한 병 입장에서 전진 방향의 대각)
    const board = withPieces([[p, { type: 'JOL', side: 'HAN' }]])
    const moves = generateJolMoves(board, p)
    expect(hasPos(moves, pos(5, 9))).toBe(true) // 대각 전진(중앙으로)
    expect(moves).toHaveLength(4) // 직교 3 + 대각 1
  })

  it('상대 궁성의 가장 깊은 귀퉁이에서는 대각이 후퇴 방향이라 허용되지 않는다', () => {
    const p = pos(4, 10) // 초 궁성의 가장 아래 귀퉁이
    const board = withPieces([[p, { type: 'JOL', side: 'HAN' }]])
    const moves = generateJolMoves(board, p)
    expect(hasPos(moves, pos(5, 9))).toBe(false) // 그 대각은 후퇴 방향
    expect(moves).toHaveLength(2) // 전진은 보드 밖이라 제외, 좌우만 남음
  })

  it('자기 궁성 안(상대 궁성이 아님)에서는 대각 보너스가 적용되지 않는다', () => {
    const p = pos(4, 1) // 한 궁성 귀퉁이(원칙적으로 병이 도달할 수 없는 자리지만 로직 검증용)
    const board = withPieces([[p, { type: 'JOL', side: 'HAN' }]])
    const moves = generateJolMoves(board, p)
    expect(hasPos(moves, pos(5, 2))).toBe(false)
    expect(moves).toHaveLength(3) // 직교만: (4,2),(3,1),(5,1)
  })
})
