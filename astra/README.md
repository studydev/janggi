# Astra 장기

한 기기에서 두 사람이 즐기는 한국 장기입니다. 첨부된 개발 명세의 **P0~P9와 P12**를 구현했습니다. **P10 AI와 P11 온라인 대전은 포함하지 않습니다.**

TypeScript(strict), React 18, Vite, SVG, useReducer + Context, Vitest를 사용합니다. 기존 앱이나 상위 배포 설정에 의존하지 않는 독립 프로젝트입니다.

## 실행

Node.js 22.12 이상이 필요합니다. 저장소 루트에서:

```sh
cd astra
npm ci
npm run dev -- --port 5180
```

개발 주소는 `http://localhost:5180/`입니다. 포트가 사용 중이면 Vite가 표시하는 다른 포트를 사용합니다.

```sh
npm run build
npm run preview -- --port 5182
```

## 기능

- 양 진영의 마상 배치 4종 선택과 장기판 미리보기
- 7종 기물 이동, 궁성 대각선, 장군과 외통, 빅장 설정, 반복 국면 판정
- 클릭, 마우스 드래그, 터치 탭과 드래그, 키보드 착수
- 차례, 경과 시간, 양쪽 점수, 잡힌 기물, 마지막 수와 장군 표시
- 한 수 쉬기, 무르기, 기권 확인, 상대의 응답을 받는 무승부 제안
- JSON 기보 내보내기와 검증된 불러오기, 처음/이전/다음/마지막 수 재생
- 자동 저장과 새로고침 복구 확인, 손상된 저장 데이터의 원본 백업
- 보드 뒤집기, 한자/한글 표기, 색각 보조 팔레트, 동작 감소 설정
- 배포 빌드의 오프라인 PWA, 설치 아이콘, 오류 경계와 기보 복구

## 규칙의 근거

[RULES.md](RULES.md)는 사용자가 제공한 [개발 프롬프트](../janggi-dev-prompts.md)의 P1 명세를 수정 없이 보존한 파일이며, 모든 규칙 판단의 기준입니다. 다른 장기 변형이나 샹치 규칙을 추가하지 않습니다.

- 강은 없습니다. 상은 1직진 + 2대각이며 두 중간 지점을 확인합니다.
- 포는 이동과 공격 모두 정확히 하나의 포대를 넘습니다. 포를 넘거나 잡을 수 없습니다.
- 궁은 잡히지 않습니다. 장군을 해소할 수 없을 때 외통으로 종료합니다.
- 장군 상태에서 패스할 수 없습니다. 스테일메이트 패배도 없습니다.
- 빅장은 활성화되어 있으면 즉시 점수 판정합니다. 반복은 기물 종류·진영·위치와 차례를 기준으로 셉니다.
- 기물 합계는 각 72점입니다. 화면의 한 점수에는 덤 1.5점이 포함되어 초기 73.5점입니다.
- 빅장, 반복, 무승부 제안 수락 시 높은 점수의 진영이 승리합니다. 제안 수락은 단순 무승부가 아닙니다.

## 구조

| 위치 | 역할 |
| --- | --- |
| [src/engine/types.ts](src/engine/types.ts) | 보드, 기물, 수, 설정과 불변 상태 타입 |
| [src/engine/board.ts](src/engine/board.ts) | 0~89 인덱스, 좌표 변환, 초기 배치와 텍스트 출력 |
| [src/engine/moves](src/engine/moves) | 기물별 의사이동 생성기 |
| [src/engine/rules.ts](src/engine/rules.ts) | 공격·장군·합법수, 착수·패스·무르기 |
| [src/engine/result.ts](src/engine/result.ts) | 외통·빅장·반복·점수·기권·합의 판정 |
| [src/engine/game-record.ts](src/engine/game-record.ts) | JSON 형식 검사, 모든 수 재검증, 국면 재생 |
| [src/engine/janggi-notation.ts](src/engine/janggi-notation.ts) | 기물·좌표·기보 표기의 단일 정의 |
| [src/ui/Board.tsx](src/ui/Board.tsx) | 규칙을 판단하지 않는 props 기반 SVG 렌더러 |
| [src/ui/game-state.ts](src/ui/game-state.ts) | 엔진 함수를 호출하는 대국 reducer |
| [src/ui/GameContext.tsx](src/ui/GameContext.tsx) | Context, 경과 시간, 자동 저장과 복구 |
| [src/ui/storage.ts](src/ui/storage.ts) | 브라우저 저장소 접근 및 실패 처리 |
| [src/ui/ErrorBoundary.tsx](src/ui/ErrorBoundary.tsx) | 화면 오류 시 기보 보존·백업·재시작 |

엔진은 React, DOM, 브라우저 API를 참조하지 않습니다. 기존 저장소 엔진의 구조와 perft 기준을 참고했지만, 실행 시 다른 프로젝트를 import하지 않습니다. 착수 가능 여부는 엔진이 판단하고, 종료·리플레이 중 조작 차단은 reducer가 담당합니다.

## 검증

```sh
npm run test:run
npm run validate:random
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:offline
```

- perft의 고정 기준: `MSMS / MSMS`, 깊이 1~3에서 **32 / 1,024 / 33,506**. 패스를 포함하며, 결과 판정으로 중단하지 않는 이동 트리 기준입니다.
- 랜덤 1,000판: 시드 `20260905`, 16개 배치 조합, 빅장 on/off, 반복 2~4회 설정을 순환합니다. 모든 생성된 수의 궁 포획·좌표·포·졸 조건과 착수 후 궁성·자기 장군·불변성·무르기 복원을 검사합니다.
- 랜덤 정책은 128수 이후 패스 확률을 높여 반복 종료를 유도합니다. 별도 수 제한 점수 판정을 추가하지 않으며, 768수 안에 정상 종료하지 못하면 실패입니다.
- 브라우저 검증은 데스크톱 1440×1000과 모바일 390×844를 사용합니다. 터치 드래그, 키보드, JSON 왕복, 자동 저장, 렌더링 오류, WCAG 검사, 모달 포커스, 44px 조작 영역, 320~1440px 가로 넘침과 동작 감소를 검사합니다.
- 오프라인 검증은 실제 배포 빌드에서 네트워크를 끊고 새로고침·복구·추가 착수·표기 변경을 확인합니다. 다른 앱 캐시 보존도 확인합니다.

오류 복구 테스트의 `intentional render failure` 로그는 의도적으로 발생시키는 검증용 오류입니다. 테스트용 서버는 5181, 배포 검증 서버는 5182 포트를 사용하며 완료 후 종료됩니다.

## 기보와 복구

기보는 `format: "astra-janggi"`, `version: 1` 형식입니다. 초기 마상 배치, 규칙 설정, `{ from, to, piece, captured, isPass }` 수 목록, 경과 시간과 수동 종료 사유를 저장합니다.

불러오기는 Zod로 구조를 검사한 뒤 초기 배치부터 모든 수를 엔진으로 다시 둡니다. 기물·포획 정보의 변조, 불법 수, 종료 뒤의 추가 수를 거부합니다. 파일은 최대 2 MB, 수 목록은 최대 5,000수입니다. 임의의 보드를 그대로 신뢰하는 기능은 없습니다.

자동 저장 키는 `astra:match:v1`, 표시 설정은 `astra:preferences:v1`입니다. 리플레이 위치·선택한 기물·미응답 제안은 저장하지 않고 실제 대국 상태를 복원합니다. 복구 확인 전에 기존 저장을 덮어쓰지 않습니다. 저장소가 차단되거나 가득 차도 대국과 JSON 다운로드는 계속 사용할 수 있습니다.

키보드는 방향키로 교차점을 이동하고 `Enter` 또는 `Space`로 선택·착수하며 `Escape`로 선택을 해제합니다. 기보 재생 중에는 착수가 차단되고, 대국으로 돌아오면 원래 진행 상태가 유지됩니다.

## PWA와 배포

PWA는 `build`/`preview`에서만 활성화됩니다. 최초 온라인 방문과 서비스 워커 설치가 필요하며, HTTPS 또는 localhost에서 동작합니다. 화면 아래의 **오프라인 준비 완료** 상태 이후에 오프라인으로 새로고침할 수 있습니다. 개발 서버는 캐싱하지 않습니다.

기본 빌드는 상대 경로를 사용합니다. 고정된 하위 경로에 배포할 때는:

```sh
ASTRA_BASE=/astra/ npm run build
ASTRA_BASE=/astra/ npm run preview -- --port 5182
ASTRA_BASE=/astra/ npm run test:offline
```

생성된 배포 디렉터리를 해당 경로에서 정적으로 제공합니다. `ASTRA_BASE`는 앞뒤에 `/`를 포함합니다. 기본 경로로 돌아가려면 환경변수 없이 다시 빌드합니다. 상위 저장소의 통합 배포 목록은 변경하지 않았습니다.

React·Zod·규칙 엔진과 Noto Sans KR/Noto Serif KR 폰트가 로컬로 번들링됩니다. Workbox는 앱 코드, CSS, WOFF2 폰트와 아이콘을 미리 캐싱하며 `astra-janggi` 캐시 이름을 사용합니다. 새 버전은 사용자 요청 시 현재 대국을 저장한 뒤 적용합니다.

설치 아이콘은 이미 포함되어 있습니다. 아이콘을 다시 생성할 때만 `npm run icons`와 Playwright용 Chromium이 필요합니다. AI 워커와 온라인 서버는 후속 구현 범위입니다.
