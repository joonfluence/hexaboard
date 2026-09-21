# 서버(apps/bootstrap-http) 이미지. 빌드 컨텍스트는 저장소 루트다.
# Node 버전은 .nvmrc와 맞춘다.
FROM node:24.21.0-slim AS build
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@todo/bootstrap-http
# 서버 실행에 필요한 파일과 운영 의존성만 /out에 모은다.
RUN pnpm --filter @todo/bootstrap-http deploy --legacy --prod /out

FROM node:24.21.0-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out .
USER node
# PORT는 플랫폼이 주입한다. 마이그레이션만 실행하려면 `node dist/migrate.js`로 덮어쓴다.
CMD ["node", "dist/main.js"]
