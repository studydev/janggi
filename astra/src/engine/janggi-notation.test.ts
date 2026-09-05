import { expect, it } from 'vitest'
import { formatMove, pieceLabel, pointLabel } from './janggi-notation'

it('centralizes side-aware glyphs, accessible labels and move notation', () => {
  const piece = { id: 'cho-jol', type: 'JOL', side: 'CHO' } as const
  expect(pieceLabel(piece)).toBe('卒')
  expect(pieceLabel({ ...piece, side: 'HAN' }, 'hangul')).toBe('병')
  expect(pointLabel({ file: 1, rank: 7 }, piece)).toBe('초 졸, 7행 1열')
  expect(formatMove({ from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 }, piece, captured: null, isPass: false })).toBe('1,7 졸 1,6')
  expect(formatMove({ from: null, to: null, piece: null, captured: null, isPass: true })).toBe('한 수 쉬기')
})