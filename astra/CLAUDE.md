# Astra 프로젝트 규칙

- TypeScript(strict), React 18, Vite, SVG, Vitest를 사용한다.
- 상태는 useReducer + Context로 관리한다.
- src/engine은 브라우저 API, DOM, React를 참조하지 않는 순수 TypeScript 모듈이다.
- 엔진 상태는 불변이다. makeMove와 pass는 새 GameState를 반환한다.
- src/ui는 렌더링과 입력만 담당하며 규칙 판단은 엔진 함수를 호출한다.
- RULES.md가 모든 규칙 판단의 최우선 근거다. 다른 체스류 게임의 규칙으로 보완하지 않는다.
- 규칙 로직을 변경하기 전에 재현 테스트를 작성한다. 모듈별로 구현하고 검증한다.
- 규칙이 불명확하면 사용자에게 질문한다.
- 강은 없다. 상은 1직진+2대각이다. 포는 이동과 공격 모두 정확히 하나의 포대가 필요하며, 포를 넘거나 잡을 수 없다.
- 현재 범위는 P0~P9와 P12다. P10 AI와 P11 온라인 대전은 구현하지 않는다.
- astra 밖의 파일은 변경하지 않는다.

검증: npm run test:run, npm run validate:random, npm run lint, npm run build, npm run test:e2e, npm run test:offline.