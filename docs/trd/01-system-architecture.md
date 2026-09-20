# TRD 01. 시스템 아키텍처

## 전체 구성

```
Browser ──(앱 로드)──────────> Vercel   apps/web (Next.js, 클라이언트 중심)
Browser ──(REST, CORS)──────> Render   apps/bootstrap-http (NestJS) ──> Neon (Postgres)
```

- 프론트는 SSR을 최소화한 클라이언트 중심 구조다. 브라우저가 서버 API를 직접 호출하므로 서버에 CORS 설정이 필요하다.
- 서버는 상시 실행되는 Node 서버라 서버리스 중심인 Vercel이 아니라 Render에 둔다.
- 환경은 하나(프로덕션)이며 `main` 브랜치가 배포된다. ([06. 배포 전략](06-deployment.md))

## 모노레포 구조 (계획, 아직 생성 전)

```
to-do-app/
├─ apps/
│  ├─ web/               Next.js + FSD
│  └─ bootstrap-http/    NestJS 진입점: 컨트롤러, DTO, 모듈 조립, 마이그레이션 CLI
├─ packages/
│  ├─ domain/            엔티티, 값 객체 (프레임워크 프리)
│  ├─ application/       유스케이스 + 포트 (Nest 데코레이터 허용)
│  ├─ persistence/       MikroORM 엔티티, 매퍼, 리포지토리 어댑터, 마이그레이션
│  └─ api-client/        OpenAPI 스펙 + 생성 타입 + openapi-fetch 래퍼
├─ docs/
├─ pnpm-workspace.yaml
└─ turbo.json
```

- 패키지 매니저는 pnpm, 워크스페이스 도구는 Turborepo다.
- 서버 앱 이름을 `api`가 아니라 `bootstrap-http`로 한 이유: 서버는 HTTP 외에 이벤트, GraphQL 등 다른 진입점도 가질 수 있는데, `api`는 HTTP만 가리키는 좁은 이름이기 때문이다.
- OpenAPI 스펙 파일(`openapi.json`)과 생성 타입은 `packages/api-client`에 함께 두고 커밋한다. `bootstrap-http`가 스펙을 내보내 이 위치에 쓰고, `api-client`가 타입을 생성한다.
- Turborepo에 `generate` 태스크를 두고 "스펙 내보내기 → 타입 생성" 순서로 잇는다. 수동 실행이라 `build`에는 묶지 않는다. 이 순서는 태스크 의존이며, `api-client`가 `bootstrap-http`를 패키지로 import하지는 않는다.

## 헥사고날 매핑

참고한 로컬 스터디 프로젝트 weave-server(Kotlin/Spring, Gradle 모듈 기반 헥사고날)의 방식을 TS 모노레포로 옮겼다.

| 계층 | 패키지 | 역할 | 웹을 아는가 |
|------|--------|------|-------------|
| Domain | `packages/domain` | 엔티티, 값 객체 (Title, Position, Priority) | 모름 |
| Application | `packages/application` | 유스케이스(Inbound 포트), Repository 포트(Outbound 포트) | 모름 |
| Outbound 어댑터 | `packages/persistence` | MikroORM 엔티티, 매퍼, 리포지토리 구현 | 모름 |
| Inbound 어댑터 + 진입점 | `apps/bootstrap-http` | 컨트롤러, DTO, 모듈 조립 | **아는 유일한 곳** |

- 코어(domain, application)는 HTTP, 이벤트, GraphQL 같은 프로토콜을 모른다. 프로토콜마다 진입점 앱을 따로 붙일 수 있다.
- 웹 관련 의존성(`@nestjs/platform-express`, Swagger 등)은 `bootstrap-http`만 가진다.

## 프론트엔드 구조

- FSD(Feature-Sliced Design)를 쓴다. Next의 `app`은 라우팅 껍데기만 두고 FSD 레이어는 별도 배치한다. FSD의 `pages` 레이어는 Next Pages Router와 충돌하므로 `views`로 개명한다.
- 프론트는 `packages/api-client`만 바라보고 서버 코드를 가져오지 않는다.

## 관련 문서

- 경계 규칙: [04. 계층 간 경계 규칙](04-layer-boundaries.md)
- 기술 선택 상세: [02. 기술 스택 상세](02-tech-stack-detail.md)
