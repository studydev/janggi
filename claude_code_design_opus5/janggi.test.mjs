import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function engine() {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync('janggi-engine.js', 'utf8'), sandbox);
  return sandbox.window.JanggiEngine;
}

test('initial game offers legal first moves and swaps turns after a move', () => {
  const E = engine();
  const game = E.newGame('마상마상', '마상마상', { bikjang: true, repLimit: 3 });
  const moves = E.legalMoves(game);
  assert(moves.length > 0);
  assert.equal(E.makeMove(game, moves[0]).turn, 'HAN');
});

test('check detection identifies an exposed opposing general', () => {
  const E = engine();
  const board = Array(90).fill(null);
  board[E.IDX(5, 1)] = { t: 'GUNG', s: 'HAN' };
  board[E.IDX(4, 10)] = { t: 'GUNG', s: 'CHO' };
  board[E.IDX(5, 5)] = { t: 'CHA', s: 'CHO' };
  const state = { board, turn: 'HAN', history: [], captured: { HAN: [], CHO: [] }, config: {}, reps: {} };
  assert.equal(E.isCheck(state, 'HAN'), true);
});

test('design document keeps its local runtime dependencies', () => {
  const html = readFileSync('Janggi.dc.html', 'utf8');
  assert.match(html, /src="\.\/support\.js"/);
  assert.match(html, /src="janggi-engine\.js"/);
  assert.match(html, /_ds\/industry-/);
});
