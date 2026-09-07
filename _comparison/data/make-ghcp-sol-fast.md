# GitHub Copilot 개발 기록: Sol Fast

| 항목 | 값 |
| --- | --- |
| Model | GPT-5.6 Sol Fast (MAX 1M) |
| 도구 | GitHub Copilot |
| 프로젝트 | [sol-fast](../../sol-fast/) |
| Usage | 1825.8 크레딧 |
| Time | 36분 31초 |
| Steps | 150 |
| Files | 54개 |
| Lines | 12,386줄 (텍스트 전체, 빈 줄 포함) |
| 코드 비공백 LOC | 3,680줄 |
| 규모 측정일 | 2026-09-07 |

시간·사용량·Steps는 제공된 기록을 유지했다. 파일·라인 수는 [공통 집계 기준](README.md#측정-기준)에 따른 현재 실측값이며, 개발 당시 편집량이 아니다. 이 결과물은 다른 작업 폴더에서 새로 구현한 뒤 옮겨 왔다.

## 개발 로그

<details>
<summary>원문 펼치기</summary>

~~~~text

요청 범위를 P0~P9와 P12로 잡고, 먼저 문서의 규칙을 고정한 뒤 현재 작업공간과 프로젝트 생성 지침을 확인하겠습니다. 그 다음 엔진을 테스트 가능한 단위로 먼저 만들고 UI·저장·PWA까지 연결하겠습니다.

Read testjjang

Read janggi-dev-prompts.md

Read skill web-artifacts-builder

Read skill project-setup-info-local

문서가 요구하는 핵심 경계는 명확합니다. sol-fast에는 React 18/Vite 기반 뼈대를 만들고, 엔진이 UI 없이 빌드·테스트되는지를 첫 판별 기준으로 삼겠습니다. 이후 브라우저 레이어는 검증된 엔진 API만 호출하도록 붙이겠습니다.

먼저 빈 대상 폴더를 만든 뒤 공식 Vite 템플릿으로 초기화하겠습니다. 생성 직후 의존성과 설정을 문서의 React 18·Vitest 조건에 맞추고, 엔진부터 작은 단위로 검증하겠습니다.

Created sol-fast

최신 Vite 생성기가 새 린터 선택 질문을 추가해 비대화형 초기화가 멈췄습니다. 남아 있는 프롬프트를 확인해 기본 TypeScript 템플릿 선택으로 완료한 뒤 생성 결과를 바로 점검하겠습니다.

터미널 출력 확인됨

터미널에서 Enter 누름

터미널로 n 보내기

스캐폴딩은 완료됐고 개발 서버는 아직 시작하지 않았습니다. 이제 생성된 설정과 기본 진입점만 확인해, 엔진 테스트를 먼저 실행할 수 있는 최소 구성으로 바꾸겠습니다.

Read sol-fast

Read package.json

Read App.tsx

Read index.css

Read tsconfig.app.json

첫 차이는 스캐폴드가 React 19/TypeScript 6을 선택했다는 점입니다. 문서 계약인 React 18과 strict TypeScript로 맞추고 Vitest, PWA, 아이콘 의존성을 추가하겠습니다. 이 변경이 맞는지는 곧바로 npm install로 버전 해석 가능 여부를 확인합니다.

편집함
package.json+13-8
할 일 5개 생성함

Set-Location 'C:\Work\Azure\testjjang\sol-fast'; npm install; $installExit=$LASTEXITCODE; Write-Output "--- resolved key versions ---"; npm list react vite vitest --depth=0; $listExit=$LASTEXITCODE; Write-Output "npm install exit code: $installExit"; if ($installExit -ne 0) { exit $installExit } elseif ($listExit -ne 0) { exit $listExit }
의존성 해석은 시작됐지만 설치가 도구의 2분 제한을 넘겼습니다. 프로세스 자체는 계속 실행 중이므로 완료 결과만 회수하고, 성공하면 바로 규칙 문서와 순수 엔진 구현으로 넘어가겠습니다.

터미널 출력 확인됨

설치가 아직 진행 중이라 이 단계에서는 파일 작업을 더 진행하지 않고 완료 신호를 기다리겠습니다. 설치 종료 즉시 엔진 구현과 검증을 이어가겠습니다.

의존성 설치가 백그라운드에서 진행 중입니다. 완료되는 즉시 구현을 이어가겠습니다.

설치가 정상 종료된 상태를 확인했습니다. 이제 규칙 명세를 프로젝트에 고정하고, 데이터 모델과 이동 생성기를 테스트와 함께 구현한 뒤 엔진 테스트를 먼저 통과시키겠습니다.

먼저 설치된 버전과 생성된 진입 파일만 확인하겠습니다. 이 확인으로 React 18/Vitest 기반이 실제로 고정됐는지, PWA 설정을 어디에 붙일지 결정할 수 있습니다.

Read src

Read vite.config.ts

Read package-lock.json, lines 1 to 100

Read main.tsx

Read index.html

엔진의 첫 구현은 좌표·초기 배치·불변 상태에 한정하겠습니다. 가설은 “90칸 1차원 보드와 궁성 헬퍼가 정확하면, 이후 모든 기물 규칙을 같은 좌표계에서 독립 검증할 수 있다”이며, 초기 기물 32개와 좌표 왕복 테스트가 이를 바로 반증할 수 있습니다.

편집함
CLAUDE.md+22-1
편집함
RULES.md+42-1
편집함
types.ts+77-1
편집함
board.ts+192-1
편집함
board.test.ts+49-1
Execution complete: 보드 엔진 테스트


Summary: PASS — 1 test file, 4 tests passed; no failures.

좌표 기반 테스트가 통과했습니다. 다음은 기물별 의사이동 생성기를 분리해 구현하며, 특히 포의 “포대 정확히 하나, 포를 넘거나 잡지 못함”과 상의 두 중간 지점 차단을 독립 테스트로 고정하겠습니다.

편집함
common.ts+79-1
편집함
cha.ts+23-1
편집함
po.ts+53-1
편집함
ma.ts+30-1
편집함
sang.ts+30-1
편집함
palace.ts+51-1
편집함
jol.ts+46-1
편집함
index.ts+31-1
편집함
moves.test.ts+182-1
할 일 6개 생성함

Execution complete: 기물 이동 규칙 테스트

이동 생성기 14개 규칙 테스트가 모두 통과했습니다. 이제 장군 판정, 자기 궁 노출 필터, 착수·쉬기·무르기의 불변 갱신과 승부 판정을 연결하겠습니다. 여기서 “궁을 잡는 수는 합법수에 포함하지 않고 외통으로 종료한다”를 명시적으로 검증합니다.

이동 생성기가 14개 규칙 테스트를 통과했습니다. 이제 합법수 필터에서 궁 노출과 궁 포획을 막고, 착수·쉬기·무르기를 모두 불변 상태 전이로 묶겠습니다. 그 위에 외통·빅장·반복·점수 판정을 올려 엔진 한 사이클을 닫겠습니다.

편집함
types.ts+0-0
편집함
jol.ts+0-0
편집함
rules.ts+158-1
편집함
result.ts+79-1
편집함
rules.test.ts+109-1
편집함
result.test.ts+72-1
겹치는 엔진 패치 두 개 중 하나가 정상 적용됐고, 다른 하나는 같은 위치가 이미 바뀌어 거부됐습니다. 적용된 구현만 기준으로 전체 엔진 테스트를 실행해 실제 타입·행동 오류를 식별하겠습니다.

엔진 27개 테스트가 모두 통과했습니다. 이제 P6의 회귀 검증을 추가해 초기 합법수 수와 장기 랜덤 진행의 불변 조건을 고정하고, 기보 표기·JSON 재생에 쓸 순수 유틸까지 엔진 층에서 마무리하겠습니다.

Read rules.ts

Read result.ts

Read engine

Read types.ts

Read jol.ts

P6은 실행 비용이 큰 1,000판 검증과 빠른 단위 테스트를 분리하겠습니다. 단위 테스트는 perft 기준값·직렬화 왕복을 고정하고, 별도 validate:random 명령은 결정적 난수로 1,000판의 보드·궁성·포·졸 불변 조건을 검사하도록 만들겠습니다.

편집함
package.json+0-0
편집함
janggi-notation.ts+21-1
편집함
game-record.ts+82-1
편집함
validation.ts+109-1
편집함
random-validation.ts+5-1
편집함
record.test.ts+44-1
Execution complete: 기보·검증 테스트

시작 중: Connect UI and storage(2/4)

랜덤 검증은 규칙 종료에 도달하면 일찍 멈추므로 “항상 200국면”이라는 테스트 가정만 틀렸고, 실제로는 168국면을 정상 검증했습니다. 종료 허용 범위와 검증된 국면 수를 확인하도록 테스트를 고쳐 같은 검사를 다시 실행하겠습니다.

편집함
record.test.ts+4-1
Execution complete: 기보·검증 테스트 재실행

기보 왕복과 랜덤 불변 테스트가 통과했습니다. perft를 느슨한 증가 조건으로 남기지 않고 초기 국면 depth 1~3의 실제 값을 계산해 회귀 기준으로 고정하겠습니다.

설치된 vite-node 버전은 인라인 -e 실행을 지원하지 않았습니다. 재사용 가능한 perft-baseline.ts 스크립트를 추가해 같은 계산을 파일 기반으로 실행하고, 출력값을 테스트에 반영하겠습니다.

편집함
perft-baseline.ts+7-1
Execution complete: perft 기준 스크립트 실행

초기 국면 perft 값은 pass 포함 기준 32 / 1024 / 33506입니다. 이 값을 테스트에 고정하고, 엔진 전체 테스트로 규칙 계층을 한 번 마감하겠습니다.

편집함
package.json+1-0
편집함
record.test.ts+3-2
Execution complete: 엔진 회귀 테스트

시작 중: Implement PWA features(3/5)

이제 브라우저 상태층을 엔진 위에 얹겠습니다. useReducer + Context가 착수·쉬기·무르기·기권·무승부·리플레이를 한 경로로 관리하고, reducer 테스트로 UI가 엔진을 우회하지 않는지 먼저 확인하겠습니다.

편집함
GameContext.tsx+199-1
편집함
GameContext.test.ts+51-1
Execution complete: 게임 상태 reducer 테스트

상태층이 테스트를 통과했습니다. 다음 편집은 규칙을 전혀 계산하지 않는 SVG 보드입니다. 클릭·터치 드래그는 SVG 좌표를 가장 가까운 교차점으로 환산하고, 키보드는 단일 포커스와 방향키/Enter로 같은 활성화 콜백을 사용하게 하겠습니다.

편집함
Board.tsx+358-1
Checked Board.tsx, no problems found

SVG 보드는 타입 진단 없이 통과했습니다. 리플레이의 “마지막”도 기록 탐색 상태로 유지해 착수가 차단되도록 reducer 의미를 한 번 다듬고, 별도의 “대국으로 돌아가기”에서만 라이브 상태로 복귀시키겠습니다.

편집함
GameContext.tsx+5-2
편집함
GameContext.test.ts+3-2
Execution complete: 리플레이 reducer 재검증

리플레이 상태 전이도 다시 통과했습니다. 이제 설정 화면과 실제 대국 화면을 연결합니다. 로컬 2인만 제공하고, 점수·잡힌 기물·기보·타이머·쉬기·무르기·기권·무승부·JSON 입출력·복구·리플레이를 한 화면에서 완결하겠습니다.

대형 패치가 기본 App.tsx의 실제 길이와 컨텍스트가 맞지 않아 전체 적용 전 중단됐습니다. 파일을 작은 단위로 나눠 먼저 새 화면 컴포넌트를 추가하고, 마지막에 진입점은 파일 전체를 정확히 교체하겠습니다.

Read ui

Searched for regex aria-disabled|tabIndex (**/sol-fast/src/ui/Board.tsx), 1 result

Read App.tsx

Read main.tsx

우선 공용 모달과 오류 경계를 추가하고, 설정 미리보기의 보드는 포커스 대상에서 제외하겠습니다. 이 세 파일을 타입 검사한 뒤 화면별로 이어 붙이겠습니다.

편집함
Board.tsx+0-0
편집함
Modal.tsx+48-1
편집함
ErrorBoundary.tsx+33-1
Checked Board.tsx, Modal.tsx, ErrorBoundary.tsx, no problems found

공용 UI 기반은 오류

할 일 목록 업데이트됨

없이 통과했습니다. 설정 화면은 양 진영의 네 가지 마·상 배치를 즉시 SVG 미리보기에 반영하고, 빅장과 반복 횟수를 엔진 설정으로 그대로 전달하도록 추가하겠습니다.

편집함
SetupScreen.tsx+142-1
Checked SetupScreen.tsx, no problems found

설정 화면은 타입 오류 없이 추가됐습니다. 이제 대국 화면을 붙이며, 사용자가 보는 상태는 라이브/리플레이 모두 엔진 상태에서 재구성하고 착수는 오직 MOVE 액션으로만 들어가게 유지하겠습니다.

편집함
GameScreen.tsx+413-1
Checked GameScreen.tsx, no problems found

대국 화면도 타입 진단을 통과했습니다. 이제 기본 Vite 데모 진입점을 제거하고, 자동 저장 복구 모달과 오류 경계를 실제 앱 루트에 연결하겠습니다.

편집함
App.tsx+48-113
편집함
main.tsx+4-1
Execution complete: 앱 TypeScript 빌드

빌드는 앱 코드가 아니라 최신 Vite 템플릿의 TypeScript 6 전용 옵션 erasableSyntaxOnly 때문에 멈췄습니다. 프로젝트 계약을 TypeScript 5.7로 맞춘 만큼 두 tsconfig에서 그 옵션만 제거하고 같은 빌드를 다시 실행하겠습니다.

편집함
tsconfig.app.json+0-1
편집함
tsconfig.node.json+0-1
Execution complete: 앱 빌드 재검증

앱 진입점이 프로덕션 빌드까지 통과했습니다. 다음으로 테마 초기화 스크립트를 첫 JavaScript로 배치하고, 오프라인 서비스 워커·설치 매니페스트·장기 아이콘을 추가해 PWA 골격을 먼저 검증하겠습니다.

편집함
vite.config.ts+0-0
편집함
index.html+67-3
편집함
janggi-icon.svg+13-1
Execution complete: PWA 프로덕션 빌드

PWA 빌드가 매니페스트와 서비스 워커까지 생성됐습니다. 이제 남은 기본 Vite 스타일을 완전히 교체해야 하므로 두 CSS 파일의 전체 범위를 확인한 뒤, Clawpilot 변수만 사용하는 반응형 대국 UI로 한 번에 바꾸겠습니다.



두 기본 CSS 파일은 각각 작은 데모 전용 파일이라 전체 교체가 가장 안전합니다. 먼저 전역 타이포그래피·버튼·포커스·색상 규칙을 바꾸고, 빌드로 CSS 구문을 확인한 뒤 화면별 레이아웃을 적용하겠습니다.

편집함
index.css+143-95
시작 중: Create responsive SVG Janggi board with interactions(2/3)

Execution complete: 전역 CSS 구문 검증

전역 스타일 구문은 PWA 빌드까지 통과했습니다. 화면 스타일은 장기판을 중심에 두고 데스크톱에서는 현황·판·기보의 3열, 모바일에서는 현황→판→기보의 1열로 재배치하며, 기물 이동은 실제 CSS transform 전환으로 보이도록 SVG 그룹도 함께 조정하겠습니다.

편집함
Board.tsx+1-1
편집함
App.css+1023-166
Execution complete: 반응형 UI 빌드 검증

기본 화면과 PWA 번들이 완성됐습니다. 마무리 전에 빠른 드래그가 pointermove 없이 끝나는 경우도 도착 좌표로 거리를 계산하게 하고, 랜덤 검증에서 포의 마지막 수를 이전 국면의 포 규칙으로 역검증하도록 보강하겠습니다. README에도 실행·구조·제외 범위를 명시합니다.

편집함
Board.tsx+0-0
편집함
validation.ts+14-1
편집함
README.md+40-23
Execution complete: 보강 변경 검증

보강 테스트와 프로덕션 빌드가 통과했습니다. 이제 정적 린트와 전체 35개 테스트(예상)를 실행해 화면 코드까지 확인하고, 이어서 별도 1,000판 검증과 의존성 감사 결과를 확인하겠습니다.

기능 테스트 35개와 린트는 통과했지만 React 정적 분석 경고가 8개 남았습니다. 효과 안에서 즉시 상태를 바꾸는 패턴은 파생 상태로 치환하고, reducer/상수는 Context 컴포넌트 파일에서 분리해 경고 없이 마무리하겠습니다.

Read GameContext.tsx

Read GameScreen.tsx, lines 60 to 135

Read App.tsx

경고 원인은 모두 국소적입니다. Context 파일을 Provider 전용으로 분리하고, 선택·결과 모달은 effect로 초기화하지 않고 현재 게임 해시와 결과 키에서 파생되도록 바꾸겠습니다. 자동 저장 복구도 지연 초기화로 읽어 렌더 후 상태 갱신을 없앱니다.


GameContext.tsx 삭제됨

린트 경고는 모두 제거됐고 reducer 테스트도 통과했습니다. 빌드의 단일 오류는 이미 resultOpen 계산에서 제외한 PLAYING 비교를 JSX에서 한 번 더 써서 생긴 중복 타입 축소이므로 그 조건만 제거하고 재빌드하겠습니다.

Read GameScreen.tsx, lines 378 to 405

편집함
GameScreen.tsx+1-1
Execution complete: 프로덕션 빌드 재실행

프로덕션 빌드가 다시 통과했고 React 린트도 무경고입니다. 이제 명세의 고비용 검증인 결정적 랜덤 대국 1,000판을 실행해 실제 진행 중 규칙 불변 조건을 확인하겠습니다.

1,000판에서 61,016개 국면의 불변 조건은 모두 통과했고 996판이 180수 제한 안에 규칙 종료됐습니다. P5의 “완주” 기준까지 맞추기 위해 검증 상한을 400수로 높이고, 1,000판 모두 종료되지 않으면 명령 자체가 실패하도록 강화하겠습니다.

편집함
validation.ts+1-1
편집함
random-validation.ts+3-0
Execution complete: 1,000판 완주 재검증

1,000판 모두 규칙 종료까지 완주했고 60,173개 국면에서 불변 조건 위반이 없었습니다. 이제 개발 서버를 띄운 뒤 데스크톱·모바일에서 설정 화면, 실제 착수, 리플레이와 레이아웃을 브라우저로

시작 중: Build setup and local two-player game screens(3/4)

검증하겠습니다.

서버는 http://127.0.0.1:5173/에서 실행 중입니다. 먼저 설정 화면의 접근성 트리와 실제 렌더를 확인하고, 그 페이지에서 대국 시작과 착수까지 연속 검증하겠습니다.

http://127.0.0.1:5173/에서 열린 브라우저 페이지

브라우저 도구의 첫 탐색이 30초 제한을 넘겼지만 탭 자체는 열렸습니다. 열린 페이지를 그대로 읽어 앱 로드 여부와 지연 원인을 확인하겠습니다.

두는 장기 읽기

설정 화면은 정상 로드됐고 양 진영 32개 기물의 접근성 이름과 모든 설정 컨트롤이 노출됩니다. 데스크톱 픽셀 배치를 캡처한 뒤, 실제 “대국 시작→초 졸 착수→기보 생성” 흐름을 실행하겠습니다.

픽셀 렌더는 선명하고 기물·궁성 선이 정상입니다. 다만 현재 브라우저 폭에서 반응형 단일 열이 적용되며 미리보기가 설정 위로 올라와 첫 화면을 과도하게 차지하므로, 실제 CSS 뷰포트와 요소 위치를 측정해 순서를 바로잡겠습니다.

측정된 통합 브라우저 뷰포트는 787×484였고, 940px 이하 규칙에서 미리보기가 첫 행으로 강제된 것이 원인이었습니다. 작은 화면에서는 설정을 먼저 보여주도록 그 한 줄을 제거한 뒤, 바로 대국 흐름을 검증하겠습니다.

편집함
App.css+0-4
Execution complete: 설정 순서 수정 빌드

작은 화면의 설정 우선 순서가 빌드에 반영됐습니다. 이제 기본 배치로 대국을 시작하고, SVG 좌표를 사용해 초의 1행... no, actual rank7,file1 piece from top. Use DOM role img aria-label "초 졸, 7행 1열". To click via board pointer, accessibility img has no click handler but event bubbles to svg. Playwright locator.click on g[aria-label] sends pointer to center, svg handler handles. Then click destination empty point has id point-1-6 circle with pointer-events none; locator.click fails because pointer events none, but we can use board coordinate via page.mouse.click or dispatch pointer. Better use keyboard or calculate SVG bbox. We can call page.evaluate dispatch PointerEvent on svg with client coords corresponding. But run_playwright_code can use page.mouse bounding box and conversion. Simpler use keyboard:

click board to focus at maybe center? default focus set 5,9 but clicking source updates. Then click source via page.getByLabel('초 졸, 7행 1열').click({force:true}) should pointerdown/up at group and Board handles. Then destination empty hit circle pointer events none, click svg coordinates:
Get SVG boundingBox and map viewbox: x = bbox.x + 62/700bbox.width, y = bbox.y+ (62+572)/772*bbox.height for rank6. page.mouse.click. This should activate selected then move. Use run_playwright_code and return relevant text/history. Or use drag from source to dest with mouse; requirement drag support. We can test click first.
Start game.

두는 장기을(를) 다시 로드함

대국 시작 후 초 차례·32기물·모든 조작 버튼이 정상입니다. 초의 1열 졸을 클릭해 합법수 표시를 확인한 다음, 보드 포커스에서 ↑ + Enter로 17→16 착수를 실행해 클릭과 키보드 경로를 함께 검증하겠습니다.

클릭 선택에서 합법수 2개가 표시됐고, 키보드 착수 후 차례·기보·자동 저장이 모두 갱신됐습니다. 이어 한의 1열 병을 실제 포인터 드래그로 14→15 이동시켜 터치/드래그와 CSS 이동 경로를 검증하겠습니다.

포인터 드래그로 14 병 15가 기록되고 원래 교차점에서 기물이 사라진 것까지 확인했습니다. 다음은 처음/다음/마지막 리플레이가 착수를 막는지 확인한 뒤 라이브로 복귀하겠습니다.

리플레이에서 초기·1수·마지막 국면이 정확히 재구성됐고 조작 버튼이 비활성화되며, “대국으로 돌아가기”에서만 다시 활성화됐습니다. 새로고침 후 자동 저장 복구 모달이 뜨고 2수 상태로 복원되는지 확인하겠습니다.

새로고침 복구 모달이 2수를 표시했고, 이어 두기 후 기물 위치·차례·기보가 그대로 복원됐습니다. 마지막으로 390×844 모바일 뷰포트에서 가로 넘침과 보드·버튼 배치를 측정하고 스크린샷으로 확인하겠습니다.

모바일 측정에서 보드와 44px 조작 버튼은 정상이나, 테스트 환경의 실측 CSS 폭이 312px로 축소되어 전역 min-width: 320px 때문에 8px 가로 넘침이 생겼습니다. 최소 폭 강제를 제거해 아주 좁은 화면에서도 스크롤 없이 맞추고 다시 측정하겠습니다.


재측정 결과 scrollWidth 300 < viewport 312로 가로 넘침이 사라졌고 보드도 276px 폭 안에서 유지됩니다. 모바일 전체 화면을 캡처해 겹침이나 잘림을 최종 확인하겠습니다.

모바일 캡처에서 헤더·차례·점수·보드·조작 버튼이 겹치지 않고 기물 텍스트도 컨테이너 안에 맞습니다. 이제 색상 하드코딩·음수 자간 같은 디자인 위반이 남지 않았는지 정적 검색하고, 의존성 감사에서 앞서 보고된 취약점이 런타임에 영향을 주는지 확인하겠습니다.





정적 검색 결과 앱 CSS에는 하드코딩 색상·음수 자간이 없고, AI/온라인 모듈 참조도 없으며 VS Code 진단도 0개입니다. 의존성 감사는 런타임과 개발 의존성을 나눠 확인해 필요한 경우에만 버전을 조정하겠습니다.

레이아웃 정적 검증도 깨끗합니다. 남은 사용자 흐름 중 쉬기·무르기·무승부·기권 확인 모달을 브라우저에서 직접 눌러, 각 버튼이 화면만 존재하는 것이 아니라 상태를 정확히 바꾸는지 확인하겠습니다.

쉬기·무르기·기권 확인·무승부 수락과 종료 후 조작 잠금까지 모두 실제 브라우저에서 동작했습니다. 최종 게이트로 전체 테스트, 무경고 린트, 프로덕션/PWA 빌드, 런타임 의존성 감사를 한 번 더 실행하겠습니다.

sol-fast에 P0~P9·P12 범위의 로컬 2인 웹 장기를 완성했습니다. 엔진 35개 테스트, 1,000판/60,173국면 검증, 무경고 린트, PWA 빌드, 데스크톱·모바일 브라우저 흐름까지 모두 통과했습니다.

완료했습니다. sol-fast에 구현했으며 현재 실행 주소는 http://127.0.0.1:5173/ 입니다.

검증: 테스트 35/35, 랜덤 1,000판 완주, 린트 0건, PWA 빌드 성공. P10·P11은 제외했습니다.

~~~~

</details>