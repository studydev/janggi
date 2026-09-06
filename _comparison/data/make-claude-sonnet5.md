# Claude Code 개발 기록: Sonnet5

| 항목 | 값 |
| --- | --- |
| Model | Claude Sonnet5 |
| 도구 | Claude Code |
| 플랜 | Pro |
| 프로젝트 | [claude_sonnet5](../../claude_sonnet5/) |
| Usage | 5시간 사용량 윈도우의 약 33% 소진 |
| Time | 미기록 |
| Steps | 미기록 |
| Files | 69개 |
| Lines | 10,985줄 (텍스트 전체, 빈 줄 포함) |
| 코드 비공백 LOC | 4,772줄 |
| 규모 측정일 | 2026-09-06 |

## 해석 및 측정 기준

- 사용량은 사용자가 제공한 근사 관측값이다. 5시간은 사용 한도의 집계 윈도우이며 실제 개발 소요 시간이 아니다.
- 소진율을 개발 시간, 토큰, 비용 또는 GitHub Copilot 크레딧으로 환산하지 않는다.
- 별도 세션 로그가 제공되지 않아 소요 시간과 Steps는 미기록으로 남긴다. 파일시스템 시각도 복사로 평탄화되어 개발 시간의 근거로 사용할 수 없다.
- 파일·라인 수는 [공통 집계 기준](README.md#측정-기준)에 따른 현재 폴더 실측값이며, 개발 당시 생성량이나 편집량이 아니다.

## 기록 출처

- 사용량: 사용자 제공 정보 (Pro 플랜, 5시간 윈도우 약 33%).
- 규모: 저장소의 기존 프로젝트 집계기를 이용한 2026-09-06 재측정.
- 상세 개발 로그: 미제공. 구현·테스트 통과 여부를 새로 검증한 문서가 아니다.

<details>
<summary>원문 펼치기</summary>

~~~~text

I've reviewed the spec and a verified reference implementation. The plan is clear. Let me build a fresh, independent implementation in claude_sonnet5/ following the P0→P12 order (skipping P10/P11).

Project scaffold
생성됨 파일 42개, 편집됨 파일 8개 (1개 실패), 실행됨 명령 11개 (1개 실패), 읽기 파일 3개
+2651
-88
UI: board, screens, replay
janggi-dev
브라우저 탭이 닫혔습니다
생성됨 파일 30개, 편집됨 파일 17개, 실행됨 명령 25개, 읽기 파일 2개, 검색함 코드, 사용함 도구 68개 (4개 실패)
+3514
-200

claude_sonnet5/ 폴더에 웹 장기 게임을 완성했습니다. P0–P9 + P12 전부 구현, P10/P11은 제외했습니다.

개발 서버가 Browser 패널에 떠 있습니다 (현재 대국 설정 화면).

실행
cd claude_sonnet5
npm install
npm run dev        # 개발 서버
npm test           # 108개 테스트
npm run play       # 콘솔 랜덤 대국 (엔진만)
npm run verify     # perft + 랜덤 1000판 규칙 검증
npm run build      # 타입체크 + 프로덕션 빌드
구현 내용
단계	위치	내용
P0·P1	CLAUDE.md / RULES.md	프로젝트 헌법, 규칙 명세 (프롬프트 원문 그대로)
P2	src/engine/types.ts board.ts	90칸 1D 배열, 궁성·대각선 판정, 초기 배치(마상 4종), debugPrint
P3	src/engine/moves/*	기물 7종 의사이동 생성기 — 파일마다 테스트 동봉
P4	src/engine/rules.ts	isAttacked · isCheck · generateLegalMoves · makeMove · pass · undo/replay
P5	src/engine/result.ts	외통 · 빅장 · 국면 반복 · 점수 · getGameResult
P6	src/engine/perft.ts verification.ts	perft 회귀값 고정, 랜덤 1000판 불변식 검사
P7	src/ui/Board.tsx	SVG 보드 (props만), 클릭·드래그·키보드 커서, 하이라이트, 교차점마다 aria-label
P8	src/ui/SetupScreen GameScreen + src/game/gameReducer	설정→대국 흐름, 점수·시간·잡힌 기물·기보, 쉬기/무르기/기권/무승부, 종료 다이얼로그
P9	src/game/janggi-notation.ts storage.ts	표기 단일화("출발좌표 기물명 도착좌표"), JSON 내보내기/불러오기, 처음/이전/다음/마지막 리플레이, localStorage 자동 저장 + 새로고침 복구
P12	전반	방향키+Enter 조작, 색맹 팔레트, prefers-reduced-motion, 44px 터치 타깃, 모바일 레이아웃, PWA(오프라인), ErrorBoundary, README.md
규칙 해석 (알아두실 점)
포: 이동·공격 모두 generatePoMoves 하나로 처리 — 포대 정확히 1개, 포를 넘거나 잡을 수 없음. 초기 국면에서 file 2·8 포는 앞에 병이 없어(병은 1·3·5·7·9) 합법수 0.
빅장: RULES.md 문구 그대로 — 열린 file에서 양 궁 정면 시 대국 종료, 점수 높은 쪽 승(동점 무승부). "상대가 풀 수 있으면 계속" 해석은 넣지 않았고 설정으로 끌 수 있습니다.
졸/병 표기: 초는 "졸", 한은 "병".
검증
perft(1)=31, perft(2)=961, perft(3)=30506 회귀 테스트로 고정 (perft(1)은 손으로도 확인)
랜덤 대국 1000판: 궁 잡힘/보드 밖/궁성 이탈/포가 포 넘음·잡음/졸 후진/undo 불일치 0건
브라우저에서 확인: 설정→대국→포획→리플레이→기권→새로고침 복구, 데스크톱·모바일(375px)·다크 모드
108 테스트 통과, build·lint 클린
~~~~

</details>