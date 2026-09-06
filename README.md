# 장기 (Janggi) — 같은 프롬프트, 다른 도구

같은 명세(`janggi-dev-prompts.md`, P0~P12)를 GitHub Copilot · Claude Code · Codex에서
개발한 웹 장기 11종과, 그 결과를 비용·사용량·시간·화면으로 비교하는 사이트입니다.
메인 페이지는 게임 실행이 아니라 **구현 비교**가 목적이며, 각 구현은 바로 실행해 볼 수 있습니다.

## 경로 구성

| 경로 | 폴더 | 설명 |
| --- | --- | --- |
| `/` | `deploy/portal.template.html` | 전체 11종 비용·사용량 비교표, 결과물 소개·스크린샷·앱 진입 |
| `/copus/` | `claude_opus5/` | Claude Opus 5 |
| `/csonn/` | `claude_sonnet5/` | Claude Sonnet 5 |
| `/cdesign-opus5/` | `claude_code_design_opus5/` | Claude Code Design · Opus 5 |
| `/luna/` | `luna/` | Luna |
| `/opus5/` | `opus5/` | Opus 5 |
| `/sol/` | `sol/` | Sol |
| `/sol-fast/` | `sol-fast/` | Sol Fast |
| `/astra/` | `astra/` | Astra |
| `/codex-astra/` | `codex-astra/` | Codex Astra · 수담 |
| `/sonn5/` | `sonnet5/` | Sonnet 5 |
| `/terra/` | `terra/` | Terra |
| `/comparison/` | `_comparison/` | 전체 지표 표와 개발 과정 |
| `/comparison/details.html` | `_comparison/report.html` | 기존 7종 심층 리포트 |

각 앱은 `vite build --base=/<경로>/` 로 빌드되어 서브패스에서 독립적으로 동작합니다.

## 컨테이너로 실행

```bash
docker run --rm -p 8080:80 ghcr.io/studydev/janggi:latest
# http://localhost:8080
```

이미지는 `main` 브랜치 푸시마다 GitHub Actions가 빌드해 GHCR에 올립니다
(`latest`, `sha-<short>` 태그). 헬스체크 엔드포인트는 `/healthz` 입니다.

## 로컬에서 빌드

```bash
docker build -t janggi .                 # 컨테이너 이미지
npm --prefix _comparison run stats       # 규모·파일 활동 시간 갱신
npm --prefix _comparison run code        # 코드 지표 갱신
npm --prefix _comparison run checks      # 테스트·타입체크·빌드 실행 결과 갱신
node deploy/build-all.mjs                # 정적 사이트를 dist-site/ 로
npm --prefix _comparison run thumbs      # 대국 시작 화면 썸네일 재캡처(빌드 후)
node deploy/build-all.mjs --portal-only  # 기존 앱 빌드를 유지하고 포털·비교 자료만 갱신
node --test deploy/development-records.test.mjs # 전체 모델 누락 방지·비용 환산 검사
```

[deploy/apps.json](deploy/apps.json)이 경로·이름·플랫폼·모델·결과물 소개의 기준입니다.
[deploy/development-records.json](deploy/development-records.json)은 11개 결과물의 개발 시간·Steps·크레딧·구독 사용량과 원문 문서 경로를 담습니다.
앱과 개발 기록이 누락·중복되거나 플랫폼이 일치하지 않으면 배포 빌드가 실패합니다.

첫 페이지는 전체 비교표를 우선 표시하고, 플랫폼 필터·모델 검색·비용/시간 정렬을 제공합니다.
이어지는 결과물 갤러리에 각 앱의 설명, 스크린샷 원본, 개발 기록, 실행 링크가 있습니다.
파일·라인 규모는 [규모 자료](_comparison/data/project-stats.json), 코드 구성은 [코드 자료](_comparison/data/code.json),
테스트·번들은 [기존 검증 자료](_comparison/data/checks.json)를 사용합니다. 과거 수집 지표를 현재 품질 점수로 해석하지 않습니다.

## 비용·시간 기준

- GHCP: 사용자 제공 기준 **100 크레딧 = $1**. 크레딧을 100으로 나눈 값을 소수점 셋째 자리까지 표시합니다. 실제 청구액이 아니며 구독료·포함량·세금을 반영하지 않습니다.
- Claude Code Pro: 5시간 사용량 윈도우에서 Sonnet5 약 33%, Opus5 약 65% 소진. 시간과 Steps는 미기록입니다.
- Codex / ChatGPT Pro: 한도 1회 소진 및 사용량 재설정 후 후속 연속 요청 시 42% 잔여. 각 윈도우를 100%에서 시작해 이 작업만 사용했다고 가정할 때 1.58개 윈도우입니다. 확정 소진율은 아닙니다.
- 구독료 배분 시나리오: Claude·GPT 각각 월 $20, 월 30일, 하루 2개 5시간 윈도우를 모두 활용한다고 가정합니다. 윈도우당 $20 / 60, Sonnet5 약 $0.110·Opus5 약 $0.217·Codex 조건부 약 $0.527입니다. 실제 추가 청구액이 아닙니다.
- 홈에 전체 11개 비용 그래프와 구독형 확대 그래프·계산 내역을 제공합니다. 실선은 크레딧 환산, 사선은 구독료 배분 추정입니다. [산식과 한계](_comparison/data/cost-estimates.md)를 함께 확인하세요.
- 세 플랫폼의 사용량 단위를 혼합하거나 미기록을 0으로 취급하지 않습니다. 홈의 시간은 개발 기록 기준이며 파일 활동 시간을 대체값으로 사용하지 않습니다.
- Sol Fast는 기존 Sol 복제·수정, Astra는 인접 엔진·테스트 참고 이력이 있습니다. 완전 독립 신규 개발 간 성능 순위로 단정하지 않습니다.

## 포털 검증·확장

```bash
npm --prefix astra run preview -- --outDir ../dist-site --host 127.0.0.1 --port 4190 --strictPort
# 별도 터미널에서 실행 (astra의 Playwright·Chromium 설치 필요)
node deploy/verify-portal.mjs
# 다른 주소 검증: PORTAL_URL=http://127.0.0.1:8080 node deploy/verify-portal.mjs
```

검증은 11개 비교 행·결과물·기록·앱 링크, 비용 계산, 필터·정렬·검색,
앱 진입 및 1440/390/320px 레이아웃을 확인하고 OS 임시 폴더에 화면 캡처를 남깁니다.

모델을 추가할 때 앱 목록과 개발 기록을 함께 등록하고 규모·검증 자료를 수집합니다. Claude Code Design처럼 기본 명세에 추가 디자인 지시가 있는 결과물은 비교 카드와 개발 기록에 그 조건을 명시합니다.
전체 빌드 후 썸네일을 재캡처하고 `--portal-only`로 홈에 반영합니다. 썸네일이 아직 없으면 해당 결과물은 숨기지 않고 준비 중으로 표시합니다.
모델 수나 플랫폼 구성이 바뀌면 검증 스크립트의 기대 개수도 함께 갱신합니다.

환경 아이콘은 [simple-icons](https://github.com/simple-icons/simple-icons)(CC0)의 SVG를
[deploy/icons](deploy/icons)에 두고 빌드 시 인라인합니다. 각 상표는 해당 소유자의 것입니다.

## 개별 앱 개발

```bash
cd luna && npm install && npm run dev
```

앱별 상세 내용은 각 폴더의 `README.md` 를 참고하세요.

## 알아둘 점

- 각 앱은 자체 서비스 워커(PWA)를 등록합니다. 한 오리진에 여러 PWA가 올라가 있어
  다른 앱을 방문하면 이전 앱의 오프라인 캐시가 정리될 수 있습니다(온라인 동작에는 영향 없음).
- 이미지를 갱신한 뒤에도 이전 캐시가 남을 수 있으니, 새 버전이 안 보이면
  개발자 도구 → Application → Service Workers 에서 해제 후 새로고침하세요.
