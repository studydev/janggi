# Claude Code Design · Opus 5 장기

Claude Code Design에서 만든 디자인 중심의 단일 페이지 장기 앱입니다. 팔각형 장기알, 선택 가능한 장기알·글자·서체·판 톤, 대국 전 배치 미리보기, AI 난이도와 전적, 포획·장군 효과음 및 경고 애니메이션을 제공합니다.

## 실행

```bash
npm run check
npm test
npm run build
```

`dist/`는 정적 파일만으로 서빙할 수 있으며, 배포 포털에서는 `/cdesign-opus5/` 경로로 제공됩니다.

## 비교 기준

이 결과물은 동일한 기본 장기 명세에 더해 Claude Code Design의 화면 디자인 지시를 중심으로 만든 구현입니다. 비교 포털의 코드 LOC는 앱 작성 코드만 계산하며, Claude Code Design 런타임(`support.js`)과 디자인 시스템 번들(`_ds/`)은 외부 제공 런타임으로 제외합니다.
