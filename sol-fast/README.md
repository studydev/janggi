# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

# 두는 장기

React 18, TypeScript, SVG로 만든 로컬 2인용 한국 장기 게임입니다. 규칙 엔진은 UI와 분리된 순수 TypeScript 모듈이며 오프라인 PWA로 동작합니다.

## 실행

```powershell
npm install
npm run dev
```

프로덕션 확인:

```powershell
npm run build
npm run preview
```

## 검증

```powershell
npm run test:run
npm run validate:perft
npm run validate:random
npm run lint
```

- 초기 국면 perft 기준값(pass 포함): depth 1 `32`, depth 2 `1024`, depth 3 `33506`
- `validate:random`: 결정적 난수로 1,000판을 진행하며 궁 포획, 궁성 이탈, 포 규칙, 졸·병 후진을 검사합니다.

## 구조

- `src/engine`: 좌표, 초기 배치, 기물 이동, 합법수, 장군, 승패, 점수, 기보 직렬화와 검증
- `src/game`: `useReducer`와 Context 기반 게임 상태
- `src/ui`: props 기반 SVG 보드와 설정·대국 화면
- `RULES.md`: 구현의 최우선 규칙 명세

기물 클릭 또는 드래그로 착수할 수 있고, 보드에 키보드 포커스를 둔 뒤 방향키와 Enter로도 조작할 수 있습니다. 진행 중인 대국은 브라우저에 자동 저장되며 JSON 기보 가져오기·내보내기와 전체 리플레이를 지원합니다.

AI 상대(P10)와 온라인 대전(P11)은 이번 구현 범위에서 제외했습니다.
