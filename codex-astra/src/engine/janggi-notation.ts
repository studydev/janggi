import type { MoveRecord, PieceType, Side } from './types';

const NAMES: Record<PieceType, string> = {
  GUNG: '궁', SA: '사', CHA: '차', PO: '포', MA: '마', SANG: '상', JOL: '졸',
};

export function sideName(side: Side): string {
  return side === 'HAN' ? '한' : '초';
}

export function pieceName(type: PieceType, side?: Side): string {
  return type === 'JOL' && side === 'HAN' ? '병' : NAMES[type];
}

/** This is the single source of human-readable move notation. */
export function formatMove(record: MoveRecord): string {
  if (record.isPass) return `${sideName(record.side)} 한 수 쉼`;
  if (!record.from || !record.to || !record.piece) return '잘못된 수';
  return `(${record.from.file}, ${record.from.rank}) ${pieceName(record.piece.type, record.piece.side)} → (${record.to.file}, ${record.to.rank})`;
}
