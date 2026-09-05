import { describe, expect, it } from 'vitest';
import { agreeDraw, createGame, makeMove, pass, resign } from '../engine';
import { deserializeGame, MAX_RECORD_BYTES, MAX_RECORD_MOVES, replayAt, serializeGame } from './serialization';

function captureGame() {
  let game = createGame();
  game = makeMove(game, { from: { file: 1, rank: 7 }, to: { file: 1, rank: 6 } });
  game = makeMove(game, { from: { file: 1, rank: 4 }, to: { file: 1, rank: 5 } });
  game = makeMove(game, { from: { file: 1, rank: 6 }, to: { file: 1, rank: 5 } });
  return pass(game);
}

describe('대국 파일', () => {
  it('잡은 기물과 한 수 쉼, 경과 시간을 엔진으로 복원한다', () => {
    const game = captureGame();
    expect(game.capturedPieces).toHaveLength(1);
    expect(deserializeGame(serializeGame(game, 123))).toEqual({ game, elapsedSeconds: 123 });
  });

  it.each(['resigned', 'agreed', 'repeated'] as const)('%s 종료 상태를 복원한다', (ending) => {
    const initial = createGame();
    const game = ending === 'resigned' ? resign(initial, 'CHO')
      : ending === 'agreed' ? agreeDraw(initial)
        : pass(pass(pass(pass(initial))));
    expect(game.result).not.toBeNull();
    expect(deserializeGame(serializeGame(game, 0)).game).toEqual(game);
  });

  it('선택한 마상 배치와 규칙 설정을 보존한다', () => {
    const game = pass(createGame('SANGMAMASANG', 'MASANGSANGMA', { bikjang: false, repetitionCount: 5 }));
    expect(deserializeGame(serializeGame(game, 3)).game).toEqual(game);
  });

  it.each(['{', 'null', '[]', '{"version":99}'])('잘못된 JSON 또는 형식을 거부한다: %s', (text) => {
    expect(() => deserializeGame(text)).toThrow();
  });

  it('불가능한 수와 변조된 잡은 기물을 거부한다', () => {
    const record = JSON.parse(serializeGame(captureGame(), 0));
    record.moves[0].to = { file: 1, rank: 5 };
    expect(() => deserializeGame(JSON.stringify(record))).toThrow();
    const tampered = JSON.parse(serializeGame(captureGame(), 0));
    tampered.moves[2].captured = null;
    expect(() => deserializeGame(JSON.stringify(tampered))).toThrow();
  });

  it('좌표, 반복 설정, 경과 시간, 파일 크기를 제한한다', () => {
    const text = serializeGame(captureGame(), 0);
    const coordinate = JSON.parse(text);
    coordinate.moves[0].from.file = 0;
    expect(() => deserializeGame(JSON.stringify(coordinate))).toThrow();
    const config = JSON.parse(text);
    config.config.repetitionCount = 1;
    expect(() => deserializeGame(JSON.stringify(config))).toThrow();
    const time = JSON.parse(text);
    time.elapsedSeconds = -1;
    expect(() => deserializeGame(JSON.stringify(time))).toThrow();
    expect(() => deserializeGame(' '.repeat(MAX_RECORD_BYTES + 1))).toThrow();
    const tooManyMoves = JSON.parse(text);
    tooManyMoves.moves = Array(MAX_RECORD_MOVES + 1).fill(null);
    expect(() => deserializeGame(JSON.stringify(tooManyMoves))).toThrow();
  });

  it('기물의 진영과 한 수 쉼의 잘못된 데이터를 거부한다', () => {
    const wrongSide = JSON.parse(serializeGame(captureGame(), 0));
    wrongSide.moves[0].piece.side = 'HAN';
    expect(() => deserializeGame(JSON.stringify(wrongSide))).toThrow();
    const wrongPass = JSON.parse(serializeGame(pass(createGame()), 0));
    wrongPass.moves[0].to = { file: 1, rank: 1 };
    expect(() => deserializeGame(JSON.stringify(wrongPass))).toThrow();
  });

  it('자연 종료 후 추가된 수와 변조된 승자를 거부한다', () => {
    const repeated = pass(pass(pass(pass(createGame()))));
    const record = JSON.parse(serializeGame(repeated, 0));
    record.moves.push(record.moves[0]);
    expect(() => deserializeGame(JSON.stringify(record))).toThrow();
    const winner = JSON.parse(serializeGame(agreeDraw(createGame()), 0));
    winner.result.winner = 'CHO';
    expect(() => deserializeGame(JSON.stringify(winner))).toThrow();
  });

  it('기보를 초기, 중간, 마지막으로 이동하고 원본을 보존한다', () => {
    const game = captureGame();
    const original = serializeGame(game, 0);
    expect(replayAt(game, 0)).toEqual(createGame());
    expect(replayAt(game, 2).moveHistory).toHaveLength(2);
    expect(replayAt(game, 2).capturedPieces).toHaveLength(0);
    expect(replayAt(game, 3).capturedPieces).toHaveLength(1);
    expect(replayAt(game, game.moveHistory.length)).toBe(game);
    expect(replayAt(game, -99)).toEqual(createGame());
    expect(replayAt(game, 999)).toBe(game);
    expect(serializeGame(game, 0)).toBe(original);
  });
});
