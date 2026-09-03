# 장기 (Janggi) — 웹 버전

한국 장기(將棋)를 브라우저에서 로컬 2인 대국으로 즐길 수 있는 웹 앱입니다.
AI 상대(P10)와 온라인 대전(P11)은 이번 구현 범위에 포함되지 않았습니다.

## 실행 방법

```bash
npm install
npm run dev       # 개발 서버 (http://localhost:5173)
npm run build     # 타입 체크(tsc -b) + 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과 미리보기
npm test          # 엔진 테스트 전체 실행 (vitest run)
npm run test:watch
npm run lint      # oxlint
```

## 규칙 출처

이 프로젝트의 모든 규칙 판단은 [`RULES.md`](./RULES.md) 한 곳을 근거로 구현했습니다.
장기는 중국 샹치(Xiangqi)와 다른 게임이며(강이 없음, 상은 1직진+2대각, 포는 이동도 반드시
하나를 넘어야 함, 궁성 안 대각선 이동 등), 두 게임을 혼동하지 않도록 `RULES.md`를 우선합니다.

## 아키텍처

```
src/
  engine/   순수 TypeScript 규칙 엔진. React/DOM에 의존하지 않는다.
            (types, board, moves/*, rules, result, notation, pieceLabels, perft)
  state/    UI 상태(useReducer). 화면 전환·선택·리플레이·기권 등 "진행" 개념만 다루고
            규칙 판단은 전부 engine 함수 호출로 위임한다. (gameReducer, persistence)
  ui/       렌더링 + 입력 처리(SVG 보드, 화면 컴포넌트). 규칙 로직을 두지 않는다.
```

- **엔진 (`src/engine`)**: 좌표계·궁성/대각선 판정(`board.ts`), 기물별 의사이동 생성기
  (`moves/*.ts`, 기물마다 파일 분리), 장군·합법수 필터링(`rules.ts`), 외통/빅장/반복/점수
  판정(`result.ts`), 기보 표기(`notation.ts`), perft 회귀 테스트(`perft.ts`)로 구성됩니다.
  콘솔에서 `createInitialGameState` → `generateLegalMoves` → `makeMove`만으로 대국을
  완주할 수 있습니다(UI 불필요).
- **테스트**: 기물별 이동 규칙(다리 막힘, 포대, 궁성 이탈 금지 등)과 perft(초기 국면
  depth 1~3), 랜덤 대국 자동 실행(불변식 검증: 궁이 잡히지 않음, 사/궁이 궁성을 벗어나지
  않음, 포가 포를 넘거나 잡지 않음, 졸/병이 후퇴하지 않음)을 Vitest로 검증합니다.
- **상태 (`src/state`)**: `gameReducer.ts`가 엔진의 불변 `GameState` 스냅샷 배열을 들고
  있어 무르기/리플레이를 배열 인덱스 이동만으로 구현합니다. `persistence.ts`는
  localStorage 자동 저장과 JSON 기보 내보내기/불러오기(수순 목록을 초기 배치부터
  재생하여 복원)를 담당합니다.
- **UI (`src/ui`)**: `Board.tsx`는 SVG로 9×10 교차점을 그리고, 클릭과 포인터 드래그(모바일
  터치 포함, Pointer Events 통합)를 모두 같은 이동 처리 경로로 연결합니다. 방향키로
  교차점 포커스를 이동하고 Enter/Space로 선택·착수할 수 있으며, 각 교차점에
  `aria-label`(예: "초 차, 1행 1열")을 제공합니다. 기물은 한자/한글 표기를 토글할 수 있고,
  진영은 색상뿐 아니라 링 스타일(실선/점선)로도 구분해 색맹 사용자를 배려했습니다.

## 포함되지 않은 기능

- P10 AI 상대, P11 온라인 대전(요청에 따라 이번 구현 범위 제외)
- PWA/오프라인 지원은 향후 개선 과제로 남겨두었습니다.


See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
