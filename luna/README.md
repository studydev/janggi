# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  # Luna Janggi

  RULES.md를 기준으로 만든 한국 장기 웹 게임입니다. 로컬 2인 대국만 포함하며 AI 상대와 온라인 대전은 범위에서 제외했습니다.

  ## 실행

  ```bash
  npm install
  npm run dev
  ```

  테스트와 프로덕션 빌드는 다음 명령으로 확인합니다.

  ```bash
  npm test
  npm run build
  ```

## 구조

- `src/engine/`: 좌표, 초기 배치, 기물 이동, 합법수, 승패/점수, 기보 표기
- `src/ui/`: SVG 보드, 설정 화면, 대국 화면, Context + reducer
- `src/engine/__tests__/`: 좌표·초기 배치·기물별 이동·합법수·무승부 테스트

## 포함 기능

- 마상 배치 4종 선택
- 장기 규칙에 맞는 7종 기물 이동과 자기 궁 장군 필터
- 포대 1개 규칙, 궁성 대각선, 빅장, 국면 반복, 점수 판정
- 한 수 쉬기, 무르기, 기권, 무승부 제안/수락
- 기보 목록과 처음/이전/다음/마지막 재생
- 보드 뒤집기, 한자/한글 기물 표기, 키보드 방향키/Enter 조작
- 라이트/다크 테마 및 모바일 반응형 화면
