# CLAUDE.md — 프로젝트 헌법

웹 기반 **장기(Korean Chess, Janggi)** 게임을 만든다. 아래를 프로젝트 전체 규칙으로 삼는다.

## ⚠️ 가장 중요한 주의사항 — 장기 ≠ 샹치

장기(Janggi)를 중국 샹치(Xiangqi)로 착각해서 코드를 짜는 경우가 매우 많다. 반드시 아래 차이를 지킨다.

| 항목      | 장기 (이 프로젝트)                       | 샹치 (이렇게 짜면 **오답**)      |
| --------- | --------------------------------------- | ------------------------------- |
| 강(河)    | **없음**                                | 강이 있고 상은 못 건넘          |
| 상(象)    | 1칸 직진 + 2칸 대각 (총 3칸 이동)        | 2칸 대각만                      |
| 포(包)    | **이동·공격 모두 반드시 1개를 넘어야 함** | 이동은 차처럼, 공격만 넘음      |
| 포끼리    | 포를 넘을 수 없고 포를 잡을 수도 없음    | 제한 없음                       |
| 졸/병     | 처음부터 옆으로 이동 가능, 뒤로는 불가   | 강 건너야 옆 이동               |
| 차·왕·사  | 궁성 안에서는 대각선 이동 가능          | 대각선 없음                     |
| 한 수 쉬기 | **허용됨** (스테일메이트 없음)          | 불가                            |
| 초기 배치 | 마·상 위치를 대국 전에 선택            | 고정                            |

## 기술 스택

- TypeScript (strict), React 18, Vite
- 상태관리: 외부 라이브러리 없이 `useReducer` + Context
- 보드 렌더링: SVG
- 테스트: Vitest

## 아키텍처 원칙

- `src/engine/` : **순수 함수만.** React, DOM, 브라우저 API 참조 금지. 이 폴더만으로 콘솔에서 대국이 가능해야 한다.
- `src/ui/`     : 렌더링과 입력 처리. **규칙 판단 로직을 절대 두지 않는다.**
- `src/game/`   : 엔진과 UI를 잇는 리듀서·컨텍스트·저장소. 규칙은 엔진에 위임한다.
- `src/ai/`     : (이번 범위 아님) 엔진에만 의존.
- 엔진은 **불변(immutable)** 상태로 다룬다. `makeMove`는 새 `GameState`를 반환한다.

## 작업 방식

- 한 번에 하나의 모듈만 구현한다. 요청하지 않은 파일은 건드리지 않는다.
- 규칙 로직은 구현 전에 테스트 케이스를 먼저 작성한다.
- 규칙이 애매하면 추측하지 말고 질문한다.
- **`RULES.md`에 적힌 규칙이 항상 최우선이다.** 다른 체스류 게임의 상식으로 보완하지 않는다.
- 새 세션을 시작할 때마다 `RULES.md`를 다시 읽는다.

## 금지

- 장기를 중국 샹치 규칙으로 구현하지 말 것. 강(河)은 없고, 상은 1직진+2대각, 포는 이동할 때도 반드시 하나를 넘는다.
- `src/ui/`에 규칙 판단(합법수, 장군 등)을 두지 말 것.
- 기보 표기 문자열을 `src/game/janggi-notation.ts` 밖에서 직접 조립하지 말 것.

## 범위

- **포함**: P0–P9, P12 (프로젝트 헌법, 규칙 명세, 데이터 모델, 이동 생성기, 합법수/장군, 승패/무승부,
  검증, 보드 렌더링/상호작용, 게임 흐름/화면, 기보 저장·재생, 접근성·배포 준비)
- **제외**: P10 (AI 상대), P11 (온라인 대전)

## 실행

```bash
npm install
npm run dev        # 개발 서버 (PORT 환경변수로 포트 변경 가능, 기본 5183)
npm test           # Vitest
npm run play       # 콘솔 랜덤 대국 (엔진만으로 완주하는지 확인)
npm run verify     # perft + 랜덤 대국 1000판 규칙 검증
npm run build      # 타입체크 + 프로덕션 빌드
```

## 폴더 구조

```
src/
  engine/            순수 규칙 엔진 (React/DOM 금지)
    types.ts         Side, PieceType, Position, Piece, Move, GameState, GameConfig
    board.ts         좌표 변환, 궁성 판정, 초기 배치, debugPrint
    moves/           기물별 의사이동(pseudo-legal) 생성기 + 테스트
      cha.ts po.ts ma.ts sang.ts gung.ts jol.ts  index.ts
    rules.ts         isAttacked, isCheck, generateLegalMoves, makeMove, pass, undo/replay
    result.ts        isCheckmate, isBikjang, 반복 감지, calculateScore, getGameResult
    perft.ts         합법수 트리 노드 수 (회귀 테스트 기준)
    verification.ts   랜덤 대국 불변식 검사
  game/
    janggi-notation.ts  기보 표기 (유일한 표기 조립 지점)
    gameReducer.ts      useReducer 리듀서 — 엔진 함수만 호출
    GameContext.tsx     Context provider + 훅
    storage.ts          localStorage 자동 저장/복구, JSON 내보내기/불러오기
    session-types.ts    UI 세션 상태 타입
  ui/
    Board.tsx          SVG 보드 (props만, 규칙 모름)
    SetupScreen.tsx    대국 설정 (마상 배치 선택)
    GameScreen.tsx     대국 화면 (보드 + 정보 패널 + 컨트롤)
    MoveList.tsx CapturedPanel.tsx GameOverDialog.tsx ReplayControls.tsx
    ErrorBoundary.tsx
scripts/
  random-playout.ts   npm run play
  verify-engine.ts    npm run verify
```
