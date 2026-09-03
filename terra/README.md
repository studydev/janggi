# 장기 (Janggi) — 웹 로컬 대국

브라우저에서 두 사람이 한 기기로 두는 한국 장기입니다. 규칙 엔진은 UI와 완전히
분리된 순수 TypeScript 모듈이라, 콘솔만으로도 대국을 끝까지 진행할 수 있습니다.

> 이번 구현 범위는 P0~P9 + P12입니다. **P10(AI 상대)**, **P11(온라인 대전)**은 포함하지 않습니다.

## 실행

```bash
npm install
npm run dev
```

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (Vite) |
| `npm run build` | 타입 검사 후 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm test` | 엔진·규칙 단위 테스트 + 검증 스위트 (Vitest) |
| `npm run typecheck` | 앱과 스크립트 전체 타입 검사 |
| `npm run lint` | ESLint |
| `npm run play` | **콘솔에서 무작위 대국 완주** (`npm run play -- <seed> <최대수>`) |

`npm run play`는 UI 없이 엔진만으로 한 판을 두고, 각 수의 기보·최종 국면·점수·승패를
출력한 뒤 규칙 불변식(기물 이동, 궁성 이탈, 포 규칙, 기보 재생 일치)을 검증합니다.

## 아키텍처

```
src/engine/   순수 규칙 엔진 — React·DOM·브라우저 API를 참조하지 않는다
  types.ts        Side · PieceType · Position · Move · GameState · GameConfig
  board.ts        좌표 변환(교차점 0~89), 초기 배치, 궁성/대각선 판정, debugPrint
  moves/          기물별 의사이동 생성기 (cha · po · ma · sang · gung · jol)
  rules.ts        isAttacked · isCheck · generateLegalMoves · makeMove · pass · undo
  result.ts       외통 · 빅장 · 반복 국면 · 점수 · getGameResult
  verification.ts perft, 무작위 대국 불변식 검사, undo 일관성 검사
  playout.ts      무작위 대국 1판 재생 (콘솔 스크립트가 사용)

src/game/     엔진 ↔ 화면 세션 어댑터
  GameContext.tsx    useReducer 세션 상태. 액션은 엔진 함수만 호출한다
  janggi-notation.ts 기보 표기의 유일한 출처
  storage.ts         localStorage 자동 저장/복구, 기보 JSON 스키마 검증

src/ui/       렌더링과 입력만 — 규칙 판단 없음
  Board.tsx          SVG 보드. 교차점 좌표, 클릭·드래그·키보드 입력, 착수 애니메이션
  SetupScreen.tsx    마·상 배치 선택, 빅장/반복 설정
  GameScreen.tsx     보드 · 점수 · 시계 · 잡은 기물 · 기보 · 재생 · 종료 다이얼로그
  ErrorBoundary.tsx

scripts/
  random-playout.ts  `npm run play`
```

엔진은 불변 상태로 동작합니다. `makeMove(state, move)`는 새 `GameState`를 반환하고,
무르기·재생은 기록된 수를 초기 국면부터 다시 재생해 복원합니다.

## 규칙

모든 규칙 판단의 기준은 [RULES.md](RULES.md)입니다. 중국 샹치와 다른 핵심:

- **강(河)이 없다.**
- **상(象)**: 1칸 직진 + 2칸 대각 (총 3칸). 경로 중간 두 지점 중 하나라도 막히면 못 간다.
- **포(包)**: 이동·공격 모두 사이에 정확히 기물 1개를 넘어야 한다. 포는 다른 포를
  넘거나 잡을 수 없다.
- **졸/병**: 처음부터 좌우 이동 가능. 뒤로는 불가.
- **차·궁·사**: 궁성 대각선 위에서는 대각으로 움직인다.
- **한 수 쉬기(pass)** 허용. 스테일메이트는 없다.
- 마·상 초기 배치는 대국 전 각자 선택한다. 초(楚)가 선수.

### 규칙 해석 고정

RULES.md를 코드로 옮기며 확정한 판단(명세와 충돌 시 명세 우선):

- **빅장**: `bikjangEnabled`가 켜져 있고 두 궁이 같은 file에서 사이에 기물 없이 마주
  보면, 만든 쪽과 무관하게 대국을 종료하고 점수로 승부를 가린다(동점이면 무승부).
- **반복 국면**: `board + 차례`를 키로, 같은 키가 `repetitionLimit`회(기본 3) 나타나면
  종료하고 점수로 승부를 가린다.
- **포의 공격 판정**은 포의 이동 생성기를 그대로 재사용한다(규칙이 갈라지지 않도록).
- **궁을 잡는 수**는 합법수에서 제외한다(정상 대국은 그 전에 외통으로 끝난다).

## 검증

- `verification.test.ts` — 초기 국면 perft(depth 1~3) 회귀 기준값, 300+판의 전체
  무작위 대국에서 규칙 불변식과 undo/재생 일치를 확인.
- 기물별 테스트 — 포(포대 0/1/2개, 포 넘기·잡기 금지), 상(중간 2지점 막힘), 마(다리
  막힘), 졸(뒤로 금지·상대 궁성 대각), 궁·사(궁성 이탈 금지) 등.

## 접근성 · 배포

- 반응형 SVG 보드. 세로 화면에서 보드가 잘리지 않도록 뷰포트 높이에 맞춰 크기 조정.
- 방향키로 커서 이동, Enter로 선택/착수, Esc로 선택 취소. 모든 기물에 `aria-label`.
- 진영은 색 외에 표기(한자/한글)와 형태(한 진영 이중 테두리)로도 구분. 색맹 대응
  팔레트(Okabe–Ito) 토글 제공.
- `prefers-reduced-motion`이면 착수 애니메이션과 전환을 끈다.
- 프로덕션 빌드에 서비스 워커가 앱 셸과 방문한 자산을 캐시한다. 한 번 방문 후에는
  로컬 대국과 저장된 기보를 오프라인에서 계속 사용할 수 있다(PWA 설치 가능).

## 규칙 출처

- 대한장기협회 장기 규칙(2023년 규정)의 기물 이동·장군·외통·빅장·점수제.
- 프로젝트 명세: [RULES.md](RULES.md) — 이 저장소에서는 항상 이 파일이 최우선.
