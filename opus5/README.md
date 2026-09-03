# 장기 (Janggi)

웹 브라우저에서 두는 한국 장기. 규칙 엔진은 UI와 완전히 분리된 순수 TypeScript 모듈이고,
보드는 SVG로 그린다. 로컬 2인 대국을 지원한다.

> 이 구현은 **중국 샹치가 아니라 한국 장기**다. 강(河)이 없고, 상은 1직진 + 2대각으로 움직이며,
> 포는 이동할 때도 반드시 기물 하나를 넘는다. 한 수 쉬기가 허용된다.

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입 검사 + 프로덕션 빌드
npm run preview    # 빌드 결과 확인
```

## 검증

```bash
npm test                        # 엔진 단위 테스트 + perft + 랜덤 대국 100판
npm run verify                  # perft 기준값 + 랜덤 대국 1000판 규칙 위반 검사
npm run demo:random -- --seed 7 # 콘솔에서 랜덤 대국 한 판 완주
```

`npm run verify`는 랜덤 대국을 돌리면서 아래를 매 수 검사한다. 하나라도 걸리면 실패로 끝난다.

- 궁을 잡는 수가 합법수로 생성됨
- 기물이 보드 밖으로 나감
- 궁·사가 궁성을 벗어남
- 포가 포를 넘거나 포를 잡음
- 졸·병이 뒤로 이동
- `makeMove` 후 `undoMove`가 원래 상태와 다름

초기 국면(마상마상/마상마상)의 perft 기준값은 depth 1 = 31, depth 2 = 961, depth 3 = 30506이며
`src/engine/__tests__/perft.test.ts`에 회귀 테스트로 고정되어 있다.

## 구조

```
src/
  engine/            순수 함수. React·DOM·브라우저 API를 참조하지 않는다
    types.ts         Side, PieceType, Position, GameState, 점수표
    board.ts         좌표 변환, 궁성 판정, 초기 배치, 텍스트 보드 출력
    moves/           기물별 의사이동 생성기 (cha, po, ma, sang, gung, jol)
    rules.ts         공격·장군 판정, 합법수 필터, makeMove/pass/undo
    result.ts        외통·빅장·반복·점수 판정
    janggi-notation.ts  기보 표기와 기물 이름. 문자열 조립은 여기서만 한다
    perft.ts         합법수 트리 노드 수
    verification.ts  랜덤 대국 규칙 위반 검사
  state/             useReducer 기반 화면 상태, 기보 저장·불러오기
  ui/                SVG 렌더링과 입력 처리. 규칙 판단을 두지 않는다
scripts/             콘솔 대국·회귀 검증 스크립트
```

의존 방향은 `ui → state → engine` 한 방향이다. `engine/`만으로 콘솔에서 대국이 가능하다.

## 규칙 출처

규칙은 [RULES.md](RULES.md)에 명세로 고정했다. 엔진의 모든 판단은 이 문서를 근거로 하며,
다른 체스류 게임의 상식으로 보완하지 않는다.

## 기능

- 대국 전 마·상 배치 선택(마상마상 / 상마상마 / 마상상마 / 상마마상)과 미리보기
- 클릭 착수와 드래그 앤 드롭(터치 포함), 이동 가능 지점·잡을 수 있는 지점 표시
- 마지막 수 강조, 장군 표시, 한 수 쉬기, 무르기, 기권, 무승부 제안
- 점수(차13 포7 마5 상3 사3 졸2, 한 덤 1.5)와 잡힌 기물, 경과 시간
- 기보 목록·리플레이(처음/이전/다음/마지막), JSON 내보내기·불러오기
- localStorage 자동 저장과 새로고침 후 이어하기
- 보드 뒤집기, 한자/한글 표기 전환, 색약 팔레트
- 키보드 조작(방향키 이동, Enter 선택), 기물별 aria-label, 진영을 색이 아닌 모양(원/팔각형)으로도 구분
- PWA 설정으로 오프라인에서도 로컬 대국 가능

AI 상대(P10)와 온라인 대전(P11)은 이번 구현 범위에 없다.
