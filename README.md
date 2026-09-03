# 장기 (Janggi) — 구현 모아보기

같은 명세(`janggi-dev-prompts.md`, P0~P12)로 각각 독립 구현한 웹 장기 7종과,
이를 한 번에 서빙하는 컨테이너 이미지입니다.

## 경로 구성

| 경로 | 폴더 | 설명 |
| --- | --- | --- |
| `/` | `deploy/landing.template.html` | 구현 목록(네비게이션) |
| `/copus/` | `claude_opus5/` | Claude Opus 5 |
| `/csonn/` | `claude_sonnet5/` | Claude Sonnet 5 |
| `/luna/` | `luna/` | Luna |
| `/opus5/` | `opus5/` | Opus 5 |
| `/sol/` | `sol/` | Sol |
| `/sonn5/` | `sonnet5/` | Sonnet 5 |
| `/terra/` | `terra/` | Terra |

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
node deploy/build-all.mjs                # 정적 사이트만 dist-site/ 로
```

`deploy/apps.json` 이 경로·이름·설명의 단일 소스입니다. 항목을 고치면 빌드 산출물과
랜딩 페이지가 함께 갱신됩니다.

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
