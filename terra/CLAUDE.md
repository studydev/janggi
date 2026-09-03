# 웹 장기 게임 프로젝트 헌법

웹 기반 장기(Korean Chess, Janggi) 게임을 만든다. 아래를 프로젝트 전체 규칙으로 삼는다.

## 기술 스택

- TypeScript(strict), React 18, Vite
- 상태관리: 외부 라이브러리 없이 useReducer + Context (규모 커지면 zustand)
- 보드 렌더링: SVG
- 테스트: Vitest

## 아키텍처 원칙

- `src/engine/` : 순수 함수만. React, DOM, 브라우저 API 참조 금지. 이 폴더만으로 콘솔에서 대국이 가능해야 한다.
- `src/ui/`     : 렌더링과 입력 처리. 규칙 판단 로직을 절대 두지 않는다.
- `src/game/`   : 엔진 상태를 화면 세션으로 잇는 어댑터(리듀서·저장·표기). 규칙은 엔진에 위임한다.
- `src/ai/`     : (예정, 현재 범위 밖) 엔진에만 의존.
- 엔진은 불변(immutable) 상태로 다룬다. `makeMove`는 새 `GameState`를 반환한다.

## 작업 방식

- 한 번에 하나의 모듈만 구현한다. 요청하지 않은 파일은 건드리지 않는다.
- 규칙 로직은 구현 전에 테스트 케이스를 먼저 작성한다.
- 규칙이 애매하면 추측하지 말고 질문한다.
- `RULES.md`에 적힌 규칙이 항상 최우선이다. 다른 체스류 게임의 상식으로 보완하지 않는다.
- 새 세션을 시작할 때마다 `RULES.md`를 다시 읽는다.

## 금지

- 장기를 중국 샹치 규칙으로 구현하지 말 것. 강(河)은 없고, 상은 1직진+2대각, 포는 이동할 때도 반드시 하나를 넘는다.

| 항목 | 장기 (이 프로젝트) | 샹치로 착각한 오답 |
|---|---|---|
| 강(河) | 없음 | 강이 있고 상은 못 건넘 |
| 상(象) | 1직진 + 2대각 (총 3칸) | 2칸 대각만 |
| 포(包) | 이동·공격 모두 1개를 넘어야 함 | 이동은 차처럼, 공격만 넘음 |
| 포끼리 | 포를 넘거나 잡을 수 없음 | 제한 없음 |
| 졸/병 | 처음부터 좌우 이동 가능, 뒤로 불가 | 강 건너야 옆 이동 |
| 차·왕·사 | 궁성 대각선 위에서 대각 이동 | 대각선 없음 |
| 한 수 쉬기 | 허용 | 불가 |
| 초기 배치 | 마·상 위치를 대국 전 선택 | 고정 |

## 현재 범위

- 구현: P0~P9(규칙 엔진·검증·보드·대국 흐름·기보) + P12(접근성·배포).
- 제외: P10(AI 상대), P11(온라인 대전).

## 코드 지도

```
src/
  engine/            순수 규칙 엔진 — React/DOM 금지
    types.ts         Side, PieceType, Position, Move, GameState, GameConfig
    board.ts         좌표 변환, 초기 배치, 궁성/대각선 판정, debugPrint
    moves/           기물별 의사이동 생성기 (cha, po, ma, sang, gung, jol) + index
    rules.ts         isAttacked, isCheck, generateLegalMoves, makeMove, pass, undoMove
    result.ts        isCheckmate, isBikjang, 반복 감지, calculateScore, getGameResult
    verification.ts  perft, 무작위 대국 불변식 검사, undo 일관성 검사
    playout.ts       무작위 대국 1판 재생(콘솔 스크립트가 사용)
  game/              엔진 ↔ 화면 세션 어댑터
    GameContext.tsx  useReducer 세션 상태, 액션은 엔진 함수만 호출
    janggi-notation.ts  기보 표기(유일한 출처)
    storage.ts       localStorage 자동 저장/복구, 기보 JSON 검증
  ui/                렌더링 + 입력만
    Board.tsx        SVG 보드, 교차점 좌표, 드래그·키보드 입력
    SetupScreen.tsx  마·상 배치 선택, 빅장/반복 설정
    GameScreen.tsx   대국 화면, 점수·시계·기보·재생·종료 다이얼로그
    ErrorBoundary.tsx
scripts/
  random-playout.ts  `npm run play` — 콘솔에서 무작위 대국 완주
```
