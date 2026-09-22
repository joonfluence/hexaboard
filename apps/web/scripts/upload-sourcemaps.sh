#!/bin/sh
# 빌드 뒤에 소스맵을 Grafana Faro에 올리고 배포물에서는 지운다.
# 업로드 설정이 없으면(로컬·프리뷰) 아무것도 하지 않는다. 값은 Vercel 환경변수로만 받는다.
# 번들 ID는 배포 커밋 SHA다. 브라우저가 보고하는 값과 같아야 오류가 원본 코드로 풀린다.
set -eu

if [ -z "${FARO_SOURCEMAP_API_KEY:-}" ] || [ -z "${FARO_SOURCEMAP_ENDPOINT:-}" ] \
  || [ -z "${FARO_APP_ID:-}" ] || [ -z "${FARO_STACK_ID:-}" ] \
  || [ -z "${VERCEL_GIT_COMMIT_SHA:-}" ]; then
  echo "소스맵 업로드 건너뜀: FARO_SOURCEMAP_* / FARO_APP_ID / FARO_STACK_ID / VERCEL_GIT_COMMIT_SHA 가 필요합니다."
  exit 0
fi

APP_NAME=todo-web
OUT=.next/static

pnpm exec faro-cli inject-bundle-id \
  --bundle-id "$VERCEL_GIT_COMMIT_SHA" \
  --app-name "$APP_NAME" \
  --files "$OUT/**/*.js"

# 업로드가 실패해도 배포는 막지 않되, 소스맵이 공개 배포물에 남지 않게 지운다.
if ! pnpm exec faro-cli upload \
  --endpoint "$FARO_SOURCEMAP_ENDPOINT" \
  --app-id "$FARO_APP_ID" \
  --api-key "$FARO_SOURCEMAP_API_KEY" \
  --stack-id "$FARO_STACK_ID" \
  --bundle-id "$VERCEL_GIT_COMMIT_SHA" \
  --app-name "$APP_NAME" \
  --output-path "$OUT" \
  --recursive; then
  echo "소스맵 업로드 실패: 배포는 계속하되 소스맵은 삭제합니다." >&2
fi
find "$OUT" -name '*.map' -delete
