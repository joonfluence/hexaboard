# Implementation Plan: 티켓 생성과 단건 조회

**Branch**: `001-ticket-create-get` | **Date**: 2026-09-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-ticket-create-get/spec.md`

> 정본은 `docs/`다. 기술 스택·구조·규칙은 복제하지 않고 링크로 참조한다: [tech_stack](../../docs/tech_stack.md), [TRD 02](../../docs/trd/02-tech-stack-detail.md), [TRD 04 계층 경계](../../docs/trd/04-layer-boundaries.md), [TRD 05 개발환경](../../docs/trd/05-dev-environment.md), [data_model](../../docs/data_model.md), [api_spec](../../docs/api_spec.md)

## Summary

티켓 생성(`POST /v1/tickets`)과 단건 조회(`GET /v1/tickets/{ticketId}`)를 백엔드 모노레포 골격 위에 TDD로 구현한다. 첫 슬라이스이므로 모노레포 골격과 품질 게이트(strict tsconfig, ESLint `no-explicit-any`, typecheck·lint·test 스크립트)를 먼저 만들고, 이후 `domain` → `persistence` → `application` → `bootstrap-http` 순으로 안쪽 계층부터 "실패하는 테스트 → 구현 → 정리"를 반복한다.

범위는 `apps/bootstrap-http`와 `packages/{domain, application, persistence}`다. `apps/web`, `packages/api-client`, OpenAPI 생성물은 이번 범위가 아니다.

## Technical Context

**Language/Version**: TypeScript, `strict` 모드 ([헌법 VI](../../.specify/memory/constitution.md)). 컴파일러 버전은 구현 시 확정.

**Runtime**: Node.js. 정확한 버전은 [open_questions](../../docs/open_questions.md)의 미결이며 **구현 착수 시점의 LTS를 공식 사이트에서 확인해 `.nvmrc`·`engines`에 고정**한다 (첫 태스크).

**Primary Dependencies**: NestJS(REST, `@nestjs/swagger`, class-validator), MikroORM(+ PostgreSQL 드라이버·마이그레이션), UUID v4 생성 라이브러리. 각 패키지 버전은 구현 시 공식 문서로 확인한다. ([TRD 02](../../docs/trd/02-tech-stack-detail.md))

**Storage**: PostgreSQL. 로컬은 Docker Compose, 테스트는 Testcontainers, 배포는 Neon. `position` 컬럼은 `COLLATE "C"`. ([data_model](../../docs/data_model.md))

**Testing**: Jest. `domain` 순수 단위, `persistence` Testcontainers 통합, `bootstrap-http` API 테스트. `application` 단위 테스트는 2차 범위이며 API 테스트가 전체 경로를 함께 검증한다. ([TRD 04 테스트 경계](../../docs/trd/04-layer-boundaries.md))

**Target Platform**: Node 서버 (Render 무료 플랜 배포는 이 기능 범위 밖)

**Project Type**: 모노레포 웹 서비스(백엔드만). pnpm + Turborepo.

**Performance Goals**: 없음. 평상시 응답 시간 목표는 프로젝트 전체 미결(낮은 우선순위)이다.

**Constraints**: 계층 의존 방향 `domain ← application ← persistence / bootstrap-http`, 인증 없음, 비밀값 커밋 금지.

**Scale/Scope**: 단일 사용자 학습용 앱.

**구현 시 확정 (지어내지 않음)**: Node 정확한 버전, 각 패키지 버전, 우선순위 숫자 매핑 값(예: `LOW`=1…`URGENT`=4는 예시), 순서 키 길이 상한, 요청·응답 스키마 상세(OpenAPI), `UNSUPPORTED_MEDIA_TYPE`의 프레임워크 동작.

## Constitution Check

*GATE: Phase 0 전 통과 필요, Phase 1 설계 후 재확인.*

| 원칙 | 판정 | 근거 |
|------|------|------|
| I. 문서가 정본 | 통과 | 이 plan과 산출물은 `docs/`를 링크로 참조한다. 미결은 "구현 시 확정"으로 표시했다. 구현 중 생기는 결정은 문서 4종(주제 문서, open_questions, decision_log, changelog)에 반영하는 태스크를 둔다. |
| II. 계층 경계 | 통과 | 패키지별 `dependencies`로 방향을 강제하고 역방향 import 시 실패하는 검사를 골격 단계에 둔다 (Phase A). |
| III. 테스트 먼저 | 통과 | 모든 Phase가 "Red 확인 → Green → Refactor" 순서다. 계층별 테스트 범위는 TRD 04를 따른다. |
| IV. 핵심 불변식 | 통과 | `ticketId`(UUID v4)는 도메인이 생성하고 내부 PK는 영속성 엔티티에만 둔다. 응답에 내부 PK·`position`을 노출하지 않는다 (D-80). 이동은 이번 범위 밖이라 `Position`은 "맨 뒤 추가"에 필요한 부분만 만든다. |
| V. 단순함과 범위 절제 | 통과 | `Position.between()` 등 이동용 로직, 태그, 목록·수정·삭제, `web`, `api-client`를 만들지 않는다. |
| VI. 타입 안전·API 계약 | 통과 | 모든 패키지가 공통 strict tsconfig를 상속하고 ESLint로 `any`를 막는다 (Phase A). 오류 응답은 api_spec 형식을 따르며 계약 테스트가 상태 코드·`code`·응답 형태를 직접 검증한다. |
| VII. 필수 가드레일 | 통과 | typecheck·lint·test를 태스크 완료 조건으로 둔다. `.env`는 `.gitignore`, `.env.example`만 커밋. 마이그레이션은 로컬·테스트 DB에서만 실행. 확정 스택 밖 의존성은 추가 전 확인한다. |

**위반 없음. Complexity Tracking 항목 없음.** (패키지 4개 구성은 TRD 04가 정한 구조이며 이 plan이 추가한 복잡도가 아니다.)

**Phase 1 후 재확인**: 통과. 문서에 근거가 없던 두 결정은 아래에서 사용자 승인으로 확정했다.

## 이 plan에서 확정한 결정 (2026-09-21 사용자 승인)

1. **생성 시 순서 키 충돌 처리** (D-84): 두 생성 요청이 동시에 같은 "마지막 카드 뒤" 키를 계산하면 (상태, 순서 키) 유니크 제약에 걸린다. 동시 이동과 같은 재시도 상수(D-69, 최대 3회)를 재사용하고 초과 시 `409 POSITION_CONFLICT`를 돌려준다.
2. **품질 게이트 스크립트 이름** (D-85): Turborepo 태스크 `typecheck`, `lint`, `test`, `build`, `dev`.
3. **작업 브랜치**: `development`에서 작업하고 `main`은 PR로만 반영한다 (D-62).
4. **persistence의 의존성** (D-86): `persistence`는 ORM·DB 드라이버·마이그레이션 도구·`@nestjs/common`(DI 모듈)을 자체 `dependencies`로 가지며 웹 의존성은 없다. `bootstrap-http`는 이 모듈을 조립만 한다.

## Project Structure

### Documentation (this feature)

```text
specs/001-ticket-create-get/
├── plan.md              # 이 파일
├── research.md          # Phase 0: 구현 시 확정 항목과 검증 방법
├── data-model.md        # Phase 1: 이 슬라이스의 데이터 범위 (정본은 docs/data_model.md)
├── contracts/           # Phase 1: 요청 케이스별 기대 응답표 (계약 테스트의 근거)
├── quickstart.md        # Phase 1: 실행·검증 시나리오
└── tasks.md             # /speckit-tasks 산출물
```

### Source Code (repository root)

```text
package.json                  # 루트 스크립트(turbo), engines
pnpm-workspace.yaml
turbo.json                    # typecheck, lint, test, build, dev
tsconfig.base.json            # strict 공통 설정
eslint.config.*               # no-explicit-any 등 (파일 형식은 구현 시 확인)
.nvmrc
.gitignore                    # .env 포함
.env.example                  # 값 없는 예시만
docker-compose.yml            # 로컬 PostgreSQL

packages/
├── domain/                   # Ticket, Title, Priority, Position, 도메인 오류. 프레임워크 없음
│   ├── src/
│   └── test/
├── application/              # 유스케이스(CreateTicket, GetTicket), Repository 포트 + Symbol 토큰
│   └── src/
├── persistence/              # MikroORM 엔티티, 매퍼, 리포지토리 어댑터, Nest 모듈, 마이그레이션
│   ├── src/
│   └── test/                 # Testcontainers 통합 테스트
apps/
└── bootstrap-http/           # Nest 조립, 컨트롤러, DTO, 예외 필터, 마이그레이션 CLI 설정
    ├── src/
    └── test/                 # API 테스트
```

**Structure Decision**: TRD 04의 패키지 구성을 그대로 따른다. 이번 범위에서 `apps/web`, `packages/api-client`는 만들지 않는다. 의존 방향은 각 `package.json`의 `dependencies`로 강제한다 (`persistence`는 `bootstrap-http`를 참조하지 않는다).

## 구현 순서 (TDD)

각 Phase의 모든 태스크는 **Red(실패 확인) → Green → Refactor** 순서이며, 태스크는 타입 검사·린트·테스트가 통과한 상태로 완료·커밋한다 (헌법 III, VII). 상세 태스크는 [tasks.md](tasks.md)가 정본이며 이 표는 개요다.

| Phase | 내용 | 먼저 쓰는 테스트 (Red) |
|-------|------|-----------------------|
| A. 골격·게이트 | pnpm·Turborepo 구성, strict 공통 tsconfig, ESLint(`no-explicit-any`), typecheck·lint·test 스크립트, 계층 의존 검사, `.nvmrc`·`engines`, `.gitignore`·`.env.example`, Docker Compose | `any`를 쓴 파일이 lint에서 실패하는 것, 역방향 import가 실패하는 것, 빈 테스트 러너가 동작하는 것 |
| B. domain | `Title`(트림·빈 값·100자), 설명 정규화(공백→`null`, 2000자), `Priority`(기본 `MEDIUM`), `Position`(첫 키, 마지막 키 뒤 키), `Ticket.create()`(UUID v4, 상태 `TODO`), 도메인 오류 | 각 값 객체·불변식의 경계값 테스트 |
| C. persistence | 영속성 엔티티, 매퍼(우선순위 숫자↔문자열, `ticketId`↔`public_id`), 리포지토리 어댑터(저장, `ticketId` 조회, 컬럼 마지막 키 조회), 첫 마이그레이션(CHECK, `COLLATE "C"`, (상태, 순서 키) 유니크) | Testcontainers Postgres에서 저장·조회·유니크 위반·정렬 순서 |
| D. application | `CreateTicket`(맨 뒤 추가, 충돌 재시도), `GetTicket`, 포트 토큰 | 유스케이스 동작은 Phase E API 테스트가 함께 검증(단위는 2차) |
| E. bootstrap-http | `/v1` 접두사, DTO 검증, 서버 지정 값·`tags` 거부·미지 필드 무시, 도메인 오류→HTTP 변환 필터, 오류 응답 형식, 컨트롤러, 기동 시 마이그레이션 | [contracts/](contracts/)의 모든 케이스를 API 테스트로 (상태 코드·`code`·응답 형태) |
| F. 마무리 | 문서 갱신(결정 사항 반영), 전체 게이트 실행, quickstart 검증 | quickstart의 시나리오가 통과하는 것 |

- Phase D는 유스케이스 단위 테스트가 2차 범위라 API 테스트(Phase E)가 검증한다. 이 때문에 D와 E의 테스트는 E에서 먼저 작성해 Red를 확인한 뒤 D·E를 함께 구현한다.
- Phase B의 `Position`은 "첫 카드"와 "마지막 키 뒤" 계산만 만든다. 두 키 사이 계산과 키 길이 상한은 카드 이동 기능에서 정한다 (구현 시 확정).

## Complexity Tracking

위반 없음.
