/** 화면 표시 설정. 규칙과 무관한 순수 표현 옵션. */
export type PieceStyle = 'hanja' | 'hangul';
export type Palette = 'classic' | 'colorblind';

export interface Settings {
  /** 기물에 한자(車)를 쓸지 한글(차)을 쓸지. */
  readonly pieceStyle: PieceStyle;
  /** 색맹 대응 팔레트. */
  readonly palette: Palette;
  /** 진영을 색뿐 아니라 형태로도 구분한다(한=팔각, 초=원). */
  readonly distinctShapes: boolean;
  readonly showCoordinates: boolean;
  /** 이동 애니메이션. prefers-reduced-motion 이면 자동으로 꺼진다. */
  readonly animate: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  pieceStyle: 'hanja',
  palette: 'classic',
  distinctShapes: true,
  showCoordinates: true,
  animate: true,
};

export const PALETTES: Record<Palette, { HAN: string; CHO: string; HAN_DARK: string; CHO_DARK: string }> = {
  classic: { HAN: '#d92d20', CHO: '#15803d', HAN_DARK: '#7f1d1d', CHO_DARK: '#14532d' },
  colorblind: { HAN: '#d97706', CHO: '#1d4ed8', HAN_DARK: '#92400e', CHO_DARK: '#1e3a8a' },
};
