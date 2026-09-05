# 프로젝트 원칙

- TypeScript strict + React 18 + Vite, SVG 보드, Vitest.
- RULES.md가 규칙의 유일한 기준. 한국 장기이며 샹치 규칙을 도입하지 않는다.
- src/engine은 브라우저와 React에 의존하지 않는 불변 순수 함수만 포함한다.
- src/ui는 엔진에서 전달받은 결과를 그리며 규칙을 판단하지 않는다.
- useReducer + Context로 대국 상태를 관리한다.
- 규칙 테스트를 구현보다 먼저 작성한다.
- P10 AI, P11 온라인 대전은 추후 구현한다.
