# TRD 05. 개발환경 설정

로컬 개발에 필요한 도구와 규칙이다. 아직 저장소에 코드가 없어서 품질 게이트 외의 명령 이름은 정하지 않았다. 확정된 것과 미정을 구분해 적는다.

## 필요 도구

| 도구 | 용도 | 상태 |
|------|------|------|
| Node.js | 런타임 | 확정: `.nvmrc` `24.21.0`(2026-09-21 확인한 최신 LTS Krypton), `engines`는 `>=24.21.0 <25` |
| pnpm | 패키지 매니저 | 확정 |
| Turborepo | 워크스페이스 태스크 실행 | 확정 |
| Docker | Testcontainers로 테스트용 Postgres 실행 | 확정 (필수) |
| PostgreSQL (로컬) | 로컬 개발 서버가 붙을 DB | 확정 (Docker Compose로 실행) |
| Git / GitHub | 저장소 (공개) | 확정 |

## 환경변수와 비밀값

- 저장소가 공개이므로 DB 연결 문자열 등 비밀값은 **절대 커밋하지 않는다**.
- 로컬은 `.env`를 사용하되 `.gitignore`에 넣는다.
- 배포 환경의 값은 Vercel / Render / GitHub의 환경변수·시크릿으로 관리한다.
- 어떤 변수가 필요한지(예: DB 연결 문자열, CORS 허용 오리진, 서버 주소)는 구현하면서 목록화한다.

## 필요한 스크립트

| 스크립트 | 위치 | 설명 |
|----------|------|------|
| OpenAPI 스펙·클라이언트 생성 | 수동 실행 | 서버 DTO를 바꾼 뒤 실행하고 생성물을 커밋 |
| 마이그레이션 생성/실행 | `bootstrap-http` | MikroORM CLI. 설정은 `bootstrap-http`, 파일은 `persistence` |
| 테스트 | 각 패키지 | 백엔드 Jest, 프론트 Vitest. Turborepo로 일괄 실행 |
| 품질 게이트 | 루트 | Turborepo 태스크 `typecheck`, `lint`, `test`, `build`, `dev` (`dev`는 의존 패키지를 먼저 빌드) |
| 개발 서버 | `web`, `bootstrap-http` | 로컬 실행 |

- 생성 명령은 Turborepo `generate` 태스크로 두고 수동으로 실행한다. ([01. 시스템 아키텍처](01-system-architecture.md))

## 브랜치와 CI

- 브랜치는 `main`, `development`를 쓴다.
- `main`과 `development`로 PR을 올리면 GitHub Actions가 테스트를 자동 실행한다.
- Testcontainers를 쓰므로 CI 러너에도 Docker가 필요하다. GitHub 호스티드 Ubuntu 러너는 Docker를 제공하는 것으로 알고 있으며 구현 시 확인한다.

## 로컬 DB 실행

- 로컬 개발용 PostgreSQL은 Docker Compose로 띄운다. compose 파일은 저장소에 커밋하고, 접속 정보는 비밀값이 아닌 로컬 전용 값만 쓴다.
- 이미지는 `postgres:18`(Neon 지원 범위 14~18의 최신 메이저)이며 테스트 컨테이너도 같은 이미지를 쓴다. 호스트에 설치된 PostgreSQL(5432)과 충돌하지 않도록 호스트 포트는 `127.0.0.1:54320`이다.
- 서버는 환경변수(`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `PORT`)로만 설정한다. `.env.example`을 `.env`로 복사해 채우고 `dev` 스크립트가 `node --env-file`로 읽는다.
- 테스트용 DB는 별도로 Testcontainers가 띄운다.

## Node 버전 고정

- 루트 `.nvmrc`에 버전을 적고 루트 `package.json`의 `engines`에도 명시한다. pnpm `engine-strict`로 어긋나면 설치를 막는다.
- GitHub Actions의 `setup-node`가 `.nvmrc`를 읽어 CI와 로컬 버전을 맞춘다.

## 린트·포맷

- 린트는 ESLint, 포맷은 Prettier를 쓴다.
- ESLint는 flat config(`eslint.config.mjs`)와 `typescript-eslint`를 쓴다. `no-explicit-any`는 오류이고 `ban-ts-comment`로 `@ts-ignore`·`@ts-nocheck`를 막는다.
- TypeScript는 `~6.0.3`으로 고정한다. 최신 7.x는 `typescript-eslint`(peer `<6.1.0`)와 `ts-jest`(peer `<7`)가 지원하지 않는다.
- pnpm은 `packageManager` 필드로 고정하고(`12.4.1`), 의존성의 빌드 스크립트는 `pnpm-workspace.yaml`의 `allowBuilds`에서 기본 거부한다(최소 권한).
- TypeScript는 모든 패키지에서 `strict` 모드다. `any`는 금지하며 ESLint(`no-explicit-any`)로 강제한다. `@ts-ignore`도 쓰지 않는다.
- FSD 레이어 경계 검사는 ESLint 플러그인으로 한다. 구체적인 플러그인은 구현 시점에 확인한다.

## 커밋·PR 규칙

- 커밋 메시지는 Conventional Commits(`feat:`, `fix:` 등) 관례를 따른다. 도구(commitlint, husky)로 강제하지 않는다.
- 브랜치는 `main`, `development`를 쓰고 PR은 테스트 통과 후 머지한다.

## 미결

- 현재 미결 항목 없음

## 관련 문서

- 배포: [06. 배포 전략](06-deployment.md)
- 계층 규칙: [04. 계층 간 경계 규칙](04-layer-boundaries.md)
