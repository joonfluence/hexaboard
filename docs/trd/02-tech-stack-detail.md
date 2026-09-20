# TRD 02. 기술 스택 상세

각 선택과 이유, 구현 시 확인이 필요한 점을 정리한다. 요약은 [tech_stack.md](../tech_stack.md), 결정 근거의 전체 목록은 [decision_log.md](../decision_log.md)를 본다. 패키지 버전과 유지보수 상태는 자주 바뀌므로 구현 시 공식 문서로 확인한다.

## 언어

- **TypeScript**로 프론트와 백엔드를 통일한다. 이유: 생산성을 최대한 유지하기 위해서다.

## 프론트엔드

| 항목 | 선택 | 이유·메모 |
|------|------|-----------|
| 프레임워크 | Next.js, 클라이언트 중심 | 선택 배경은 Vercel 배포였고 SSR 자체는 필요하지 않다. 서버 컴포넌트·Server Actions 학습은 인증 도입 시(2차)로 미룬다 |
| 서버 상태 | TanStack Query + openapi-fetch | 스펙에서는 타입만 생성하고 호출·캐시는 직접 구성한다. 생성물이 적다 |
| 구조 | FSD | `pages` 레이어를 `views`로 개명해 Next와의 충돌을 피한다. 루트 `app/`과 `src/` 아래 FSD 레이어의 구체 배치는 공식 문서로 확인 |
| 스타일링 | Tailwind CSS + shadcn/ui | 생산성이 높고 Next 생태계에서 흔하다. Trello 느낌은 직접 스타일링 |
| 드래그 | dnd-kit | 범용 툴킷이라 보드 로직을 직접 조립한다. 키보드 접근성 지원 범위는 구현 시 확인 |

## 백엔드

| 항목 | 선택 | 이유·메모 |
|------|------|-----------|
| 프레임워크 | NestJS, REST | 엔터프라이즈 구조(모듈, DI) 학습 |
| 구조 | 헥사고날, 패키지 단위 경계 | 위반이 빌드 단계에서 드러난다. ([04. 계층 간 경계 규칙](04-layer-boundaries.md)) |
| ORM | MikroORM | 가장 익숙해 생산성이 높고 Unit of Work 등 엔터프라이즈 패턴과 부합 |
| 마이그레이션 | MikroORM 마이그레이션 | 필수 조건. 서버 기동 시 자동 실행 |
| API 계약 | Nest DTO + `@nestjs/swagger` → OpenAPI | 서버가 진실 원천. 수동 생성 + 생성물 커밋 |
| 순서 키 | 직접 구현 | 실서비스에 가까운 방식을 원리부터 학습. 경계 조건 테스트 필수 |
| 공개 식별자 | UUID v4 | DB PK와 분리한 별도 유니크 키(`public_id`)로, 순차 PK 노출을 막는다. 무작위라 생성 시각이 드러나지 않는다. 지원 라이브러리는 구현 시 확인 |

## 데이터베이스

- **Neon (Postgres)**: 확정. 무료 플랜의 유휴 정책과 한도는 [06-deployment.md](06-deployment.md)를 본다.
- `position` 컬럼에는 바이너리 정렬(`C` collation)을 쓴다. ([data_model.md](../data_model.md))
- 로컬 개발은 로컬 PostgreSQL을 쓴다. 배포 DB(Neon)와 같은 Postgres 계열이라 동작 차이를 줄일 수 있다. 버전은 맞춰 두는 것이 좋으며 구현 시 확인한다.

## 테스트

| 영역 | 도구 | 범위 |
|------|------|------|
| 백엔드 | Jest | `domain` 단위, `persistence` 통합, API/컨트롤러 |
| 프론트엔드 | Vitest | 순수 로직 + 컴포넌트(Testing Library) |
| 테스트용 DB | Testcontainers (Postgres) | 로컬·CI에서 동일한 방식으로 컨테이너를 띄움 |

- Vitest의 기본 변환기는 데코레이터 메타데이터(`emitDecoratorMetadata`)를 지원하지 않는 것으로 알고 있어, Nest·MikroORM 테스트는 각 진영 기본값인 Jest로 분리했다. 버전에 따라 다를 수 있어 공식 문서로 확인한다.
- `application` 유스케이스 단위 테스트(Fake 포트)는 2차 범위다. API 테스트가 실제 DB로 전체 경로를 함께 검증한다.

## 인프라

| 영역 | 선택 |
|------|------|
| 웹 배포 | Vercel |
| 서버 배포 | Render 무료 플랜 |
| CI | GitHub Actions |
| 저장소 | GitHub 공개 |

## 관련 문서

- 아키텍처: [01. 시스템 아키텍처](01-system-architecture.md)
- 배포: [06. 배포 전략](06-deployment.md)
