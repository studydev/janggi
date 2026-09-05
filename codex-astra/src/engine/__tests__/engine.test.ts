import { describe, expect, it } from 'vitest';
import {
  agreeDraw, calculateScore, createGame, createInitialBoard, forwardDir, fromIndex,
  generateLegalMoves, getGameResult, isBikjang, isCheck, isCheckmate, isInBoard,
  isInPalace, isOnPalaceDiagonal, makeMove, pass, pieceAt, positionKey, resign,
  toIndex, undo,
} from '../index';
import { generateChaMoves } from '../moves/cha';
import { generatePoMoves } from '../moves/po';
import { generateMaMoves } from '../moves/ma';
import { generateSangMoves } from '../moves/sang';
import { generateGungMoves } from '../moves/gung';
import { generateSaMoves } from '../moves/sa';
import { generateJolMoves } from '../moves/jol';
import type { Board, GameState, PieceType, Position, Side } from '../types';

const p = (file: number, rank: number): Position => ({ file, rank });
type Placement = [Side, PieceType, number, number];
function board(...placements: Placement[]): Board {
  const result = Array.from({ length: 90 }, () => null) as (Board[number])[];
  placements.forEach(([side, type, file, rank], id) => {
    result[toIndex(p(file, rank))] = { id: String(id), side, type };
  });
  return result;
}
function state(placements: Placement[], turn: Side = 'CHO', bikjang = false): GameState {
  const position = board(...placements);
  return { ...createGame(undefined, undefined, { bikjang }), board: position, turn,
    positionHistory: [positionKey(position, turn)] };
}
const kings: Placement[] = [['HAN', 'GUNG', 5, 2], ['CHO', 'GUNG', 5, 9]];
const has = (moves: Position[], file: number, rank: number) => moves.some(pos => pos.file === file && pos.rank === rank);

describe('coordinates and initial board', () => {
  it('round-trips every board index and rejects invalid coordinates', () => {
    for (let i = 0; i < 90; i++) expect(toIndex(fromIndex(i))).toBe(i);
    expect(isInBoard(p(1, 1))).toBe(true);
    expect(isInBoard(p(9, 10))).toBe(true);
    for (const pos of [p(0, 1), p(10, 1), p(1, 0), p(1, 11), p(1.5, 1)]) expect(isInBoard(pos)).toBe(false);
    expect(() => toIndex(p(0, 1))).toThrow();
    expect(() => fromIndex(90)).toThrow();
    expect(forwardDir('HAN')).toBe(1);
    expect(forwardDir('CHO')).toBe(-1);
  });
  it('recognizes only the palace corners and center as diagonal points', () => {
    expect(isInPalace(p(4, 1), 'HAN')).toBe(true);
    expect(isInPalace(p(4, 1), 'CHO')).toBe(false);
    expect(isOnPalaceDiagonal(p(4, 1))).toBe(true);
    expect(isOnPalaceDiagonal(p(5, 9))).toBe(true);
    expect(isOnPalaceDiagonal(p(4, 2))).toBe(false);
    expect(isOnPalaceDiagonal(p(5, 5))).toBe(false);
  });
  it('creates 32 distinct pieces, CHO first, and exact opening scores including compensation', () => {
    const game = createGame();
    expect(game.board.filter(Boolean)).toHaveLength(32);
    expect(new Set(game.board.filter(Boolean).map(piece => piece!.id)).size).toBe(32);
    expect(game.turn).toBe('CHO');
    expect(pieceAt(game.board, p(5, 1))).toBe(null);
    expect(pieceAt(game.board, p(5, 2))?.type).toBe('GUNG');
    expect(calculateScore(game, 'HAN')).toBe(73.5);
    expect(calculateScore(game, 'CHO')).toBe(72);
  });
  it.each([
    ['MASANGMASANG', ['MA', 'SANG', 'MA', 'SANG']],
    ['SANGMASANGMA', ['SANG', 'MA', 'SANG', 'MA']],
    ['MASANGSANGMA', ['MA', 'SANG', 'SANG', 'MA']],
    ['SANGMAMASANG', ['SANG', 'MA', 'MA', 'SANG']],
  ] as const)('places both sides using %s in file order', (setup, expected) => {
    const opening = createInitialBoard(setup, setup);
    for (const rank of [1, 10]) expect([2, 3, 7, 8].map(file => pieceAt(opening, p(file, rank))?.type)).toEqual(expected);
  });
});

describe('차', () => {
  it('has 17 orthogonal destinations on an otherwise empty central board', () => {
    expect(generateChaMoves(board(['CHO', 'CHA', 5, 5]), p(5, 5))).toHaveLength(17);
  });
  it('stops before a friendly piece and immediately after an enemy', () => {
    const moves = generateChaMoves(board(['CHO', 'CHA', 5, 5], ['CHO', 'JOL', 5, 3], ['HAN', 'JOL', 7, 5]), p(5, 5));
    expect(has(moves, 5, 4)).toBe(true);
    expect(has(moves, 5, 3)).toBe(false);
    expect(has(moves, 5, 2)).toBe(false);
    expect(has(moves, 7, 5)).toBe(true);
    expect(has(moves, 8, 5)).toBe(false);
  });
  it('crosses a palace diagonal through its center without extending outside', () => {
    const moves = generateChaMoves(board(['CHO', 'CHA', 4, 1]), p(4, 1));
    expect(has(moves, 5, 2)).toBe(true);
    expect(has(moves, 6, 3)).toBe(true);
    expect(has(moves, 7, 4)).toBe(false);
  });
  it('stops at a blocked palace center', () => {
    const moves = generateChaMoves(board(['CHO', 'CHA', 4, 1], ['HAN', 'SA', 5, 2]), p(4, 1));
    expect(has(moves, 5, 2)).toBe(true);
    expect(has(moves, 6, 3)).toBe(false);
  });
});

describe('포', () => {
  it('cannot move without a screen', () => {
    expect(generatePoMoves(board(['CHO', 'PO', 5, 5]), p(5, 5))).toEqual([]);
  });
  it('jumps exactly one piece for both quiet moves and captures', () => {
    const moves = generatePoMoves(board(['CHO', 'PO', 5, 5], ['CHO', 'JOL', 5, 4], ['HAN', 'MA', 5, 2]), p(5, 5));
    expect(has(moves, 5, 4)).toBe(false);
    expect(has(moves, 5, 3)).toBe(true);
    expect(has(moves, 5, 2)).toBe(true);
    expect(has(moves, 5, 1)).toBe(false);
  });
  it('cannot jump a cannon of either side', () => {
    for (const side of ['HAN', 'CHO'] as const) {
      const moves = generatePoMoves(board(['CHO', 'PO', 5, 5], [side, 'PO', 5, 4]), p(5, 5));
      expect(has(moves, 5, 3)).toBe(false);
    }
  });
  it('cannot capture a cannon or cross a second screen', () => {
    const moves = generatePoMoves(board(['CHO', 'PO', 5, 5], ['HAN', 'JOL', 5, 4], ['HAN', 'PO', 5, 2]), p(5, 5));
    expect(has(moves, 5, 3)).toBe(true);
    expect(has(moves, 5, 2)).toBe(false);
    expect(has(moves, 5, 1)).toBe(false);
  });
  it('jumps the palace center to the opposite corner only', () => {
    const moves = generatePoMoves(board(['CHO', 'PO', 4, 1], ['CHO', 'SA', 5, 2]), p(4, 1));
    expect(has(moves, 5, 2)).toBe(false);
    expect(has(moves, 6, 3)).toBe(true);
    expect(has(moves, 7, 4)).toBe(false);
  });
});

describe('마 and 상', () => {
  it('horse moves in eight L paths and loses both moves behind a blocked leg', () => {
    expect(generateMaMoves(board(['CHO', 'MA', 5, 5]), p(5, 5))).toHaveLength(8);
    const moves = generateMaMoves(board(['CHO', 'MA', 5, 5], ['HAN', 'JOL', 5, 4]), p(5, 5));
    expect(moves).toHaveLength(6);
    expect(has(moves, 4, 3)).toBe(false);
    expect(has(moves, 6, 3)).toBe(false);
  });
  it('elephant moves three by two and crosses the center without a river', () => {
    const moves = generateSangMoves(board(['CHO', 'SANG', 5, 5]), p(5, 5));
    expect(moves).toHaveLength(8);
    expect(has(moves, 7, 2)).toBe(true);
    expect(has(moves, 3, 8)).toBe(true);
    expect(has(moves, 7, 7)).toBe(false);
  });
  it.each([[5, 4], [6, 3]])('elephant is blocked at intermediate point %i,%i', (file, rank) => {
    const moves = generateSangMoves(board(['CHO', 'SANG', 5, 5], ['HAN', 'JOL', file, rank]), p(5, 5));
    expect(has(moves, 7, 2)).toBe(false);
  });
});

describe('궁, 사 and 졸/병', () => {
  for (const [name, generator] of [['궁', generateGungMoves], ['사', generateSaMoves]] as const) {
    it(`${name} follows palace lines and cannot leave its own palace`, () => {
      expect(generator(board(['HAN', 'GUNG', 5, 2]), p(5, 2))).toHaveLength(8);
      const corner = generator(board(['HAN', 'GUNG', 4, 1]), p(4, 1));
      expect(corner).toHaveLength(3);
      expect(has(corner, 5, 2)).toBe(true);
      const edge = generator(board(['HAN', 'GUNG', 4, 2]), p(4, 2));
      expect(edge).toHaveLength(3);
      expect(has(edge, 5, 1)).toBe(false);
      expect(edge.every(pos => isInPalace(pos, 'HAN'))).toBe(true);
    });
  }
  it('soldiers move sideways from the start and never backwards', () => {
    const cho = generateJolMoves(board(['CHO', 'JOL', 5, 7]), p(5, 7));
    expect(cho).toEqual(expect.arrayContaining([p(4, 7), p(6, 7), p(5, 6)]));
    expect(has(cho, 5, 8)).toBe(false);
    const han = generateJolMoves(board(['HAN', 'JOL', 5, 4]), p(5, 4));
    expect(has(han, 5, 5)).toBe(true);
    expect(has(han, 5, 3)).toBe(false);
  });
  it('soldiers advance diagonally only on lines of the enemy palace', () => {
    expect(has(generateJolMoves(board(['CHO', 'JOL', 4, 3]), p(4, 3)), 5, 2)).toBe(true);
    expect(has(generateJolMoves(board(['CHO', 'JOL', 5, 2]), p(5, 2)), 4, 1)).toBe(true);
    expect(has(generateJolMoves(board(['CHO', 'JOL', 4, 10]), p(4, 10)), 5, 9)).toBe(false);
    expect(has(generateJolMoves(board(['HAN', 'JOL', 4, 8]), p(4, 8)), 5, 9)).toBe(true);
  });
});

describe('legal moves, transitions and results', () => {
  it('filters a pinned piece exposing its general', () => {
    const game = state([...kings, ['HAN', 'CHA', 5, 5], ['CHO', 'CHA', 5, 8]]);
    expect(isCheck(game, 'CHO')).toBe(false);
    expect(generateLegalMoves(game).some(move => move.from.file === 5 && move.from.rank === 8 && move.to.file !== 5)).toBe(false);
    expect(() => makeMove(game, { from: p(5, 8), to: p(4, 8) })).toThrow();
  });
  it('detects cannon check using the same screen rule', () => {
    expect(isCheck(state([...kings, ['HAN', 'PO', 5, 5]]), 'CHO')).toBe(false);
    expect(isCheck(state([...kings, ['HAN', 'PO', 5, 5], ['CHO', 'JOL', 5, 7]]), 'CHO')).toBe(true);
    expect(isCheck(state([...kings, ['HAN', 'PO', 5, 5], ['CHO', 'PO', 5, 7]]), 'CHO')).toBe(false);
  });
  it('never generates a capture of a general', () => {
    const game = state([...kings, ['CHO', 'CHA', 5, 4]]);
    expect(generateLegalMoves(game).some(move => pieceAt(game.board, move.to)?.type === 'GUNG')).toBe(false);
  });
  it('records captures without mutating any prior state and undo restores it exactly', () => {
    const game = state([...kings, ['CHO', 'CHA', 1, 7], ['HAN', 'MA', 1, 5]]);
    const before = JSON.stringify(game);
    const after = makeMove(game, { from: p(1, 7), to: p(1, 5) });
    expect(JSON.stringify(game)).toBe(before);
    expect(after.turn).toBe('HAN');
    expect(after.capturedPieces).toHaveLength(1);
    expect(after.moveHistory[0]?.captured?.type).toBe('MA');
    expect(undo(after)).toEqual(game);
  });
  it('allows pass, restores it exactly with undo and prohibits pass in check', () => {
    const game = createGame();
    const after = pass(game);
    expect(after.board).toEqual(game.board);
    expect(after.turn).toBe('HAN');
    expect(after.moveHistory[0]?.isPass).toBe(true);
    expect(undo(after)).toEqual(game);
    expect(() => pass(state([...kings, ['HAN', 'CHA', 5, 7]]))).toThrow();
  });
  it('distinguishes checkmate from absence of legal moves without check', () => {
    const mate = state([
      ['HAN', 'GUNG', 5, 2], ['CHO', 'GUNG', 5, 10],
      ['HAN', 'CHA', 4, 7], ['HAN', 'CHA', 5, 7], ['HAN', 'CHA', 6, 7],
    ]);
    expect(isCheckmate(mate, 'CHO')).toBe(true);
    expect(getGameResult(mate)).toMatchObject({ status: 'CHECKMATE', winner: 'HAN' });
    expect(isCheckmate(createGame(), 'CHO')).toBe(false);
  });
  it('lets a side with no legal board moves pass when it is not in check', () => {
    const game = state([
      ['HAN', 'GUNG', 5, 2], ['CHO', 'GUNG', 5, 10],
      ['HAN', 'CHA', 4, 7], ['HAN', 'CHA', 6, 7], ['HAN', 'CHA', 1, 9],
    ]);
    expect(isCheck(game, 'CHO')).toBe(false);
    expect(generateLegalMoves(game)).toEqual([]);
    expect(isCheckmate(game, 'CHO')).toBe(false);
    expect(getGameResult(game).status).toBe('PLAYING');
    expect(pass(game).turn).toBe('HAN');
  });
  it('ends on the mating move and can undo the final move exactly', () => {
    const game = state([
      ['HAN', 'GUNG', 5, 2], ['CHO', 'GUNG', 5, 10],
      ['HAN', 'CHA', 4, 7], ['HAN', 'CHA', 6, 7], ['HAN', 'CHA', 3, 8],
    ], 'HAN');
    const final = makeMove(game, { from: p(3, 8), to: p(5, 8) });
    expect(final.result).toMatchObject({ status: 'CHECKMATE', winner: 'HAN' });
    expect(generateLegalMoves(final)).toEqual([]);
    expect(undo(final)).toEqual(game);
  });
  it('treats bikjang as optional score adjudication, never a flying general attack', () => {
    const game = state(kings, 'CHO', true);
    expect(isBikjang(game)).toBe(true);
    expect(isCheck(game, 'CHO')).toBe(false);
    expect(getGameResult(game)).toMatchObject({ status: 'DRAW_BY_SCORE', winner: 'HAN' });
    expect(getGameResult({ ...game, config: { ...game.config, bikjang: false } }).status).toBe('PLAYING');
    expect(isBikjang(state([...kings, ['CHO', 'JOL', 5, 5]], 'CHO', true))).toBe(false);
  });
  it('detects threefold positions including side to move, ignoring piece identities', () => {
    const game = createGame();
    const fourthPass = pass(pass(pass(pass(game))));
    expect(fourthPass.result).toMatchObject({ status: 'DRAW_BY_SCORE', winner: 'HAN' });
    expect(positionKey(game.board, 'HAN')).not.toBe(positionKey(game.board, 'CHO'));
    expect(positionKey(game.board.map(piece => piece ? { ...piece, id: `new-${piece.id}` } : null), 'CHO')).toBe(positionKey(game.board, 'CHO'));
    expect(undo(fourthPass)).toEqual(pass(pass(pass(game))));
    expect(() => pass(fourthPass)).toThrow();
    expect(generateLegalMoves(fourthPass)).toEqual([]);
  });
  it('supports resignation and an agreed draw resolved by material scores', () => {
    expect(resign(createGame(), 'CHO').result).toMatchObject({ status: 'RESIGNED', winner: 'HAN' });
    expect(agreeDraw(createGame()).result).toMatchObject({ status: 'DRAW_BY_SCORE', winner: 'HAN' });
    expect(getGameResult(createGame()).status).toBe('PLAYING');
  });
});
