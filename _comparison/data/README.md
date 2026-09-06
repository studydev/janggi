# 모델별 개발 기록

기존 개발 기록과 사용자 제공 사용량을 요약하고, 현재 프로젝트 폴더의 파일·라인 수를 같은 기준으로 측정했다. 모델명과 컨텍스트 표기는 제공된 기록을 따른다.

- 규모 측정일: 2026-09-06.
- 시간·사용량·Steps: 개발 당시 기록 또는 사용자 제공 정보. 빈 항목은 추정하지 않고 `미기록`으로 표시한다.
- Files·Lines: 현재 폴더 실측값. 개발 당시의 편집 파일 수·추가/삭제 라인 수와 구분한다.
- 기존 8개 문서의 상세 대화는 접을 수 있는 텍스트 로그로 보존했다. 로그 속 테스트 결과·서버 URL은 당시 기록이며 이번 작업에서 재검증하지 않았다.

## GitHub Copilot

| 프로젝트 및 기록 | 모델 | 소요 시간 | 사용 크레딧 | Steps | Files | Lines | 코드 비공백 LOC |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| [sonnet5](make-ghcp-sonnet5.md) | Claude Sonnet5 (MAX 1M) | 1시간 2분 54초 | 1,014.6 | 41 | 57 | 6,340 | 2,908 |
| [opus5](make-ghcp-opus5.md) | Claude Opus5 (MAX 1M) | 40분 36초 | 1,301.6 | 48 | 54 | 7,193 | 3,682 |
| [luna](make-ghcp-luna.md) | GPT-5.6 luna (MAX 1M) | 48분 39초 | 65.3 | 201 | 48 | 4,329 | 2,133 |
| [terra](make-ghcp-terra.md) | GPT-5.6 terra (MAX 1M) | 40분 11초 | 415.2 | 179 | 52 | 8,480 | 3,934 |
| [sol](make-ghcp-sol.md) | GPT-5.6 sol (MAX 1M) | 50분 18초 | 498.9 | 236 | 61 | 8,548 | 4,071 |
| [sol-fast](make-ghcp-sol-fast.md) | GPT-5.6 Sol Fast (MAX 1M) | 11분 59초 | 485.6 | 83 | 61 | 8,546 | 4,071 |
| [astra](make-ghcp-astra.md) | GPT-6 Astra (MAX 872K) | 56분 5초 | 2,627.3 | 173 | 74 | 10,999 | 2,829 |

## 구독형 사용량

| 프로젝트 및 기록 | 도구 및 모델 | 플랜 | 소요 시간 | 사용량 관측 | Files | Lines | 코드 비공백 LOC |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
| [codex-astra](make-codex-astra.md) | Codex / GPT-6 Astra (Ultra) | ChatGPT Pro | 24분 37초 (원문 기록) | 1회 소진 후 후속 연속 요청 시 42% 잔여 | 51 | 5,655 | 3,010 |
| [claude_sonnet5](make-claude-sonnet5.md) | Claude Code / Claude Sonnet5 | Pro | 미기록 | 5시간 윈도우 약 33% 소진 | 69 | 10,985 | 4,772 |
| [claude_opus5](make-claude-opus5.md) | Claude Code / Claude Opus5 | Pro | 미기록 | 5시간 윈도우 약 65% 소진 | 69 | 10,259 | 5,716 |

## 비교 시 주의사항

- 사용자 요청에 따라 월 $20·30일·하루 2개 윈도우 가정의 [비용 환산·구독료 배분 추정](cost-estimates.md)을 별도 제공한다. 실제 청구액이나 직접적인 비용 효율 비교가 아니다.
- 크레딧과 사용량 윈도우 소진율은 단위와 한도 체계가 다르므로 직접 비교하거나 합산하지 않는다. 이 자료만으로 도구 간 비용 순위나 토큰당 효율을 계산할 수 없다.
- Claude Code의 5시간은 개발 시간이 아닌 사용량 집계 구간이다. 약 33%와 약 65%를 시간으로 환산하지 않는다. 모델별 한도·기존 사용·동시 사용 조건이 확인되지 않아 두 비율만으로 상대 비용을 단정할 수도 없다.
- Codex는 한도 소진·중단·재설정·재개가 기록되어 있다. 42% 잔여를 전체 작업 소진율로 해석하지 않으며, 24분 37초가 전체 재개 구간을 포함하는지도 확인되지 않았다.
- `sol-fast`는 기존 `sol`을 복제한 뒤 수정·검증한 작업이다. 다른 프로젝트의 신규 구현 시간과 동일 조건이 아니다. `astra`도 인접 엔진·테스트를 참고한 기록이 있어 완전 독립 구현 비교로 단정하지 않는다.
- 파일 수·라인 수는 산출물 규모이며 품질·규칙 정확도·요구사항 충족도의 척도가 아니다. 테스트·문서·설정·잠금 파일·자산 포함 여부에 따라 값이 달라진다.
- Astra의 기존 `files: 73`, `lines: +3165 -551`은 세션 기록으로 별도 보존했다. 현재 규모인 74개·10,999줄과 다른 지표다.

## 측정 기준

[기존 집계기](../scripts/analyze-project-stats.mjs)의 `analyzeProject` 계산을 재실행했다. 집계 기준은 [규모 및 파일 활동 시간 보고서](../project-size-time-report.md#측정-기준)와 같다. 파일 활동 시간은 실제 세션 시간으로 대체하지 않았다.

- Files: 프로젝트 루트 아래 재귀 파일 수. 바이너리 및 심볼릭 링크도 포함한다.
- Lines: 인식된 텍스트 파일의 빈 줄을 포함한 물리적 전체 라인 수. 코드뿐 아니라 문서·설정·잠금 파일·텍스트 자산도 포함하며, 바이너리와 심볼릭 링크의 내용은 제외한다.
- 코드 비공백 LOC: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.css`, `.html`의 공백이 아닌 라인 수. 테스트와 주석도 포함하므로 제품 소스만의 라인 수가 아니다.
- 텍스트 확장자: `.cjs`, `.css`, `.csv`, `.gitignore`, `.html`, `.js`, `.json`, `.jsx`, `.md`, `.mjs`, `.scss`, `.svg`, `.toml`, `.ts`, `.tsx`, `.txt`, `.webmanifest`, `.xml`, `.yaml`, `.yml`. `Dockerfile`, `LICENSE`, `NOTICE`도 포함한다.
- 제외 폴더: `.git`, `.idea`, `.vite`, `build`, `coverage`, `dist`, `dist-ssr`, `logs`, `node_modules`, `playwright-report`, `test-results`.
- 제외 파일: `.DS_Store`, `*.tsbuildinfo`, `*.local`, `*.log`, `.env.example`을 제외한 `.env*`.
- 10개 프로젝트 합계: **596개 파일, 텍스트 전체 81,334줄, 코드 비공백 37,126줄**.

규모 보고서와 JSON 집계 자료를 다시 생성하는 명령은 저장소 루트에서 `npm --prefix _comparison run stats`이다. 이 명령은 `make-*.md` 요약 표를 자동으로 갱신하지 않는다.