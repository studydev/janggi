# 장기 (Janggi) — 같은 프롬프트, 다른 도구

같은 명세(`janggi-dev-prompts.md`, P0~P12)를 GitHub Copilot · Claude Code · Codex에서
각각 독립 세션으로 구현한 웹 장기 10종과, 그 결과를 지표·화면으로 비교하는 사이트입니다.
메인 페이지는 게임 실행이 아니라 **구현 비교**가 목적이며, 각 구현은 바로 실행해 볼 수 있습니다.

## 경로 구성

| 경로 | 폴더 | 설명 |
| --- | --- | --- |
| `/` | `deploy/portal.template.html` | 비교 메인(환경·차트·화면 썸네일) |
| `/copus/` | `claude_opus5/` | Claude Opus 5 |
| `/csonn/` | `claude_sonnet5/` | Claude Sonnet 5 |
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
```

`deploy/apps.json` 이 경로·이름·환경·모델의 단일 소스입니다. 메인 페이지의 지표와 차트는
`_comparison/data/` 의 `project-stats.json`(규모·시간), `code.json`(코드 구성),
`checks.json`(테스트·번들), `tokens.json`·`make-*.md`(세션 기록)를 합쳐 만듭니다.
확보되지 않은 값은 추정하지 않고 `미수집`으로 표시합니다.

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
