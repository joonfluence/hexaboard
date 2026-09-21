# 기술 스택 요약표

한눈에 보는 요약이다. 이유와 세부는 [TRD 기술 스택 상세](trd/02-tech-stack-detail.md)와 [decision_log.md](decision_log.md)를 본다.

| 구분 | 스택 | 상태 |
|------|------|------|
| 언어 | TypeScript (FE/BE 통일) | 확정 |
| Frontend | Next.js (클라이언트 중심, SSR 최소화) | 확정 |
| FE 서버 상태 | TanStack Query + openapi-fetch | 확정 |
| FE 구조 | FSD. Next `app`은 라우팅 껍데기만, FSD `pages` 레이어는 `views`로 개명 | 확정 |
| 스타일링 / UI | Tailwind CSS + shadcn/ui | 확정 |
| 드래그 앤 드롭 | dnd-kit | 확정 |
| Backend | NestJS, REST | 확정 |
| BE 구조 | 헥사고날. 계층을 패키지 단위로 분리해 의존성으로 강제 | 확정 |
| API 계약 | Nest DTO + `@nestjs/swagger`로 OpenAPI 생성 → 클라이언트 타입 생성 | 확정 |
| ORM / 마이그레이션 | MikroORM. 마이그레이션 관리 필수 | 확정 |
| Database | Neon (Postgres) | 확정 |
| 저장소 | 모노레포. pnpm + Turborepo | 확정 |
| 배포 (FE) | Vercel | 확정 |
| 배포 (BE) | Render 무료 플랜 | 확정 |
| 인프라 관리 | Phase 1 PaaS → Phase 2 IaC(Terraform/OpenTofu). 이식 가능한 컨테이너 구조 | 확정(방향), 도구 세부는 [TRD 07](trd/07-infra-roadmap.md) |
| 관측성 | Grafana Cloud 단독(웹 Faro, 서버 Loki·트레이스), 계측은 OpenTelemetry 기준 | 확정(D-103), 세부 구성은 미결 |
| CI | GitHub Actions (저장소는 GitHub 공개). PR 시 테스트 실행 | 확정 |
| 테스트 (BE) | Jest | 확정 |
| 테스트 (FE) | Vitest | 확정 |
| 테스트용 DB | Testcontainers (Postgres) | 확정 |
| 로컬 개발용 DB | PostgreSQL (로컬) | 확정 |

## 상태 표기

- **확정**: 결정 완료. 패키지 버전 등은 구현 시 공식 문서로 확인한다.

## 모노레포 구성

- `apps/`: `web`, `bootstrap-http`
- `packages/`: `domain`, `application`, `persistence`, `api-client`
- 계층 규칙은 [TRD 계층 간 경계 규칙](trd/04-layer-boundaries.md)을 본다.
