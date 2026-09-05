# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# 1) build: 10개 장기 구현을 각각 서브패스 base 로 빌드해 하나의 정적 사이트로 합친다.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /src

# 의존성 설치는 lockfile 만 먼저 복사해 레이어 캐시를 살린다.
COPY claude_opus5/package.json   claude_opus5/package-lock.json   ./claude_opus5/
COPY claude_sonnet5/package.json claude_sonnet5/package-lock.json ./claude_sonnet5/
COPY luna/package.json           luna/package-lock.json           ./luna/
COPY opus5/package.json          opus5/package-lock.json          ./opus5/
COPY sol/package.json            sol/package-lock.json            ./sol/
COPY sol-fast/package.json       sol-fast/package-lock.json       ./sol-fast/
COPY astra/package.json          astra/package-lock.json          ./astra/
COPY codex-astra/package.json    codex-astra/package-lock.json    ./codex-astra/
COPY sonnet5/package.json        sonnet5/package-lock.json        ./sonnet5/
COPY terra/package.json          terra/package-lock.json          ./terra/

RUN set -eux; \
  for d in claude_opus5 claude_sonnet5 luna opus5 sol sol-fast astra codex-astra sonnet5 terra; do \
      npm --prefix "$d" ci --no-audit --no-fund; \
    done

COPY . .

ENV OUT_DIR=/site
RUN node deploy/build-all.mjs

# ---------------------------------------------------------------------------
# 2) runtime: nginx 로 정적 서빙. 컨테이너만 띄우면 바로 접속 가능.
# ---------------------------------------------------------------------------
FROM nginx:stable-alpine AS runtime

LABEL org.opencontainers.image.title="Janggi implementations portal" \
  org.opencontainers.image.description="같은 명세로 만든 10개 웹 장기 구현과 비교 자료를 서빙하는 정적 포털" \
      org.opencontainers.image.source="https://github.com/studydev/janggi" \
      org.opencontainers.image.licenses="MIT"

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
