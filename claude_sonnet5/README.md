# 웹 장기 (Janggi) · claude_sonnet5

브라우저에서 두는 한국 장기. **규칙 엔진은 UI와 완전히 분리된 순수 TypeScript** 이고,
보드는 React + SVG 로 그린다. 로컬 2인 대국, 기보 저장·재생, 오프라인(PWA) 지원.

> ⚠️ 이 구현은 **장기(Janggi)** 이지 중국 샹치(Xiangqi)가 아니다. 강(河)이 없고,
> 상(象)은 1직진 + 2대각, 포(包)는 이동할 때도 반드시 기물 하나를 넘는다.
> 전체 규칙은 [`RULES.md`](./RULES.md) 참조 — 이 파일이 모든 규칙 판단의 유일한 근거다.

## 실행

```bash
npm install
npm run dev        # 개발 서버 (기본 5183 포트, PORT 환경변수로 변경 가능)
npm test           # Vitest — 엔진/리듀서/표기 단위 테스트
npm run play       # 콘솔에서 랜덤 대국 완주 (UI 없이 엔진만)
npm run verify     # perft 기준값 + 랜덤 대국 1000판 규칙 검증
npm run build      # 타입체크 + 프로덕션 빌드 (dist/)
npm run preview    # 빌드 결과 미리보기
npm run lint       # ESLint
```

`npm run play` / `npm run verify` 는 규칙 엔진이 화면 없이도 온전히 동작함을 보여준다.

## 아키텍처

```
src/
  engine/            ── 순수 규칙 엔진. React·DOM·브라우저 API 참조 없음.
    types.ts            Side · PieceType · Position · Piece · Move · GameState · GameConfig
    board.ts            좌표 변환(0~89 1D 인덱스), 궁성/대각선 판정, 초기 배치, debugPrint
    moves/             기물별 의사이동(pseudo-legal) 생성기 — 파일마다 테스트 동봉
      cha.ts po.ts ma.ts sang.ts gung.ts jol.ts   index.ts (통합 디스패치)
    rules.ts           isAttacked · isCheck · generateLegalMoves · makeMove · pass · applyMove
                       replayHistory / replayStates / stateAtMove / undoMove
    result.ts          isCheckmate · mustPass · isBikjang · 반복 감지 · calculateScore · getGameResult
    perft.ts           합법수 트리 노드 수 (회귀 기준값)
    verification.ts    시드 RNG + 랜덤 대국 불변식 검사
    testkit.ts         테스트 전용 보드 빌더 (scene({'5,5':'cR'}))
  game/              ── 엔진과 UI 를 잇는 층. 규칙 판단은 하지 않고 엔진에 위임.
    janggi-notation.ts 기보 표기 — 유일한 표기 조립 지점 ("출발좌표 기물명 도착좌표")
    gameReducer.ts     useReducer 리듀서 — 액션은 엔진 순수 함수만 호출
    GameContext.tsx    Context Provider + 훅 + localStorage 자동 저장
    storage.ts         자동 저장/복구, 대국 JSON 내보내기/불러오기
    session-types.ts   UI 세션 상태 타입
  ui/               ── 렌더링과 입력. 규칙 로직 없음.
    Board.tsx          SVG 보드 (props 만) — 클릭·드래그·키보드, 하이라이트, 접근성 라벨
    SetupScreen.tsx    마·상 배치 선택 + 미리보기, 규칙 옵션, 대국 불러오기
    GameScreen.tsx     보드 + 차례/시간/점수/잡힌 기물/기보 + 컨트롤
    ScorePanel · CapturedPanel · MoveList · ReplayControls · GameOverDialog · ErrorBoundary
    pieceLabels.ts     한자/한글 글리프, 팔레트(색맹 대응)
scripts/
  random-playout.ts   npm run play
  verify-engine.ts    npm run verify
```

### 데이터 흐름

`UI 이벤트 → dispatch(Action) → gameReducer → engine 순수 함수(makeMove 등) → 새 GameState`.
리듀서 밖에서는 엔진 상태를 절대 바꾸지 않는다. 무르기·리플레이는 저장된
`moveHistory` 를 처음부터 재생해 국면을 재구성한다(`replayHistory`).

### 좌표계

- 보드는 9열 × 10행, 기물은 **선의 교차점**에 놓인다.
- `file` 1~9 (좌→우), `rank` 1~10 (위→아래). 한(漢)이 위쪽, 초(楚)가 아래쪽, **초가 선수**.
- 내부 저장은 길이 90 배열, `index = (rank-1)*9 + (file-1)`.

## 규칙 구현 노트

- **포(包)**: 이동·공격 모두 사이에 정확히 1개(포대)를 넘어야 한다. 포대가 0개거나
  2개 이상이면 불가. 포는 포를 넘을 수도, 잡을 수도 없다. 공격 판정도 이동
  생성기(`generatePoMoves`)를 그대로 재사용해 규칙이 갈라지지 않게 했다.
- **궁성 대각선**: 차·포·궁·사는 궁성 안 대각선을 따라 이동할 수 있다. 졸/병은 상대
  궁성 대각선 위에서 대각 전진이 가능하다.
- **한 수 쉬기**: 장군이 아닌데 둘 수가 없으면 스테일메이트가 아니라 그냥 쉰다
  (`mustPass`). 장군 중에는 쉴 수 없다.
- **빅장**: `RULES.md` 의 문구 그대로 — 양 궁이 열린 file 에서 마주보면 대국이 끝나고,
  점수가 높은 쪽이 승리(동점이면 무승부)한다. "상대가 빅장을 풀 수 있으면 계속된다"는
  세부 해석은 넣지 않았다. `설정에서 끌 수 있다`.
- **점수**: 차 13 · 포 7 · 마 5 · 상 3 · 사 3 · 졸/병 2 · 궁 0. 한(漢)이 후수 보상 덤 1.5.
  각 진영 초기 총점 72(+덤).

### 검증

- `perft(1)=31, perft(2)=961, perft(3)=30506` 을 회귀 테스트로 고정 (`src/engine/perft.test.ts`).
  `perft(1)=31` 은 손으로도 확인: 병 13 + 궁 6 + 차 4 + 마 3 + 사 4 + 상 1 + 포 0.
- 랜덤 대국 1000판에서 다음이 한 번이라도 나오면 실패 처리: 궁이 잡힘 / 보드 밖 이동 /
  사·궁의 궁성 이탈 / 포가 포를 넘거나 잡음 / 졸·병 후진 / undo 불일치.

## 접근성

- 각 교차점에 `aria-label` ("3열 7행, 초 졸, 이동 가능"). 보드는 방향키 커서 + Enter 로 조작.
- 색만으로 진영을 구분하지 않는다 — 팔각형 크기, 한자/한글 표기, 테두리 색을 함께 사용.
- 색맹 대응 팔레트(파랑/주황) 옵션.
- `prefers-reduced-motion` 이면 이동 애니메이션을 끈다.
- 터치 타깃 최소 44px, 모바일 세로에서 보드가 잘리지 않도록 레이아웃 전환.

## 범위

**포함** — P0(헌법) · P1(규칙) · P2(데이터 모델) · P3(이동 생성기) · P4(합법수/장군) ·
P5(승패/무승부) · P6(검증) · P7(보드 렌더링/상호작용) · P8(게임 흐름/화면) ·
P9(기보 저장·재생) · P12(접근성·배포).

**제외** — P10(AI 상대) · P11(온라인 대전).

## 규칙 출처

규칙 명세는 저장소 루트의 개발 프롬프트 문서( `janggi-dev-prompts.md` )의 P1 항목을
그대로 [`RULES.md`](./RULES.md) 로 옮긴 것이다. 대한장기협회 통용 규칙과 기물 점수제를
따른다.
