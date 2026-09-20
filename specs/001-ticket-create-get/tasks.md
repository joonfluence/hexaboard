# Tasks: 티켓 생성과 단건 조회

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contracts/tickets-api.md](contracts/tickets-api.md), [research.md](research.md)

**Tests**: 필수. 이 기능은 TDD로 진행한다 (헌법 III, 명세 FR-011). 모든 구현 태스크 앞에 대응하는 테스트 태스크가 있고, 테스트는 실행해 **실패(Red)를 확인**한 뒤 구현한다.

**Plan Phase 대응**: Phase 1 = plan A(골격·게이트), Phase 2 = plan B·C(domain·persistence)와 API 하네스, Phase 3~5 = plan D·E를 사용자 스토리별로 분해, Phase 6 = plan F(마무리).

## 표기와 공통 규칙

- 형식: `- [ ] T### [P?] [US?] 설명 (파일 경로)`. `[P]`는 다른 파일이며 미완료 태스크에 의존하지 않아 병렬 가능하다.
- 태스크 유형 접두어: **RED**(테스트 작성 + 실행해 실패 확인), **GREEN**(최소 구현으로 통과), **REFACTOR**(동작 유지 정리), **CHECK**(확인·검증), **DOC**(문서 갱신).
- **RED 태스크**: 테스트를 쓰고 실행해 **기대한 이유로 실패**함을 확인한다 (예: 모듈 없음, 미구현으로 인한 assertion 실패). 실패 출력 요약을 [tdd-log.md](tdd-log.md)에 기록한다 (SC-004). RED 상태는 게이트를 통과하지 못하므로 **커밋하지 않고**, 대응하는 GREEN 태스크에서 테스트와 구현을 함께 커밋한다.
- **GREEN·REFACTOR·DOC 태스크 완료 조건 (헌법 VII)**: `pnpm typecheck`, `pnpm lint`, `pnpm test`가 모두 통과하고 Conventional Commits 형식으로 커밋한다. `--no-verify`로 우회하지 않는다.
- **작업 브랜치**: `development`에서 작업하고 커밋한다. `main`으로는 PR로만 반영한다 (D-62). 커밋은 사용자가 완료 조건으로 요청한 것이며 **push는 하지 않는다** (헌법 VII).
- **커밋 전 비밀값 확인**: 스테이징된 diff에 비밀값(접속 문자열, 토큰, `.env`)이 없는지 확인한다 (헌법 VII).
- **의존성**: [tech_stack.md](../../docs/tech_stack.md)의 확정 스택 밖 패키지는 추가 전에 사용자에게 확인한다. 패키지 버전은 도입 시 공식 문서로 확인한다 (헌법 VII).
- **테스트 케이스 정의**: RED 태스크 전에 [docs/test_cases.md](../../docs/test_cases.md)의 해당 TC를 ⏳로 정의해 두고 테스트 이름에 TC ID를 넣는다. 통과하는 GREEN 커밋에서 ✅로 바꾼다 (헌법 III, D-87). 이미 끝난 T011~T044의 TC는 사후 정의했다(v0.81).
- 테스트를 통과시키려고 테스트를 약화·삭제하지 않는다 (헌법 III). 미결 항목을 만나면 값을 지어내지 않고 멈춰 보고한다 (헌법 I, VII).
- 결정이 생기면 해당 문서를 갱신한다 (Phase 6 DOC 태스크, 헌법 I).

---

## Phase 1: Setup — 골격과 품질 게이트 (plan A)

**목적**: 모노레포 골격과 품질 게이트를 만들고, 게이트가 실제로 위반을 잡는지 확인한다.

- [X] T001 CHECK 구현 착수 시점의 Node LTS 버전을 nodejs.org 공식 릴리스 페이지에서 확인하고 결과(버전, 확인일, 출처 URL)를 tdd-log.md에 기록한다. 값을 추측하지 않는다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T002 루트 워크스페이스를 만든다: `.nvmrc`와 `package.json`의 `engines`에 T001에서 확인한 버전을 기록, pnpm `engine-strict` 설정, `pnpm-workspace.yaml`(`apps/*`, `packages/*`), Turborepo `turbo.json`(태스크 `typecheck`, `lint`, `test`, `build`, `dev`, D-85). 패키지 버전은 공식 문서로 확인 (package.json, pnpm-workspace.yaml, turbo.json, .nvmrc, .npmrc)
- [X] T003 [P] `.gitignore`(`.env`, `node_modules`, 빌드 산출물 포함)와 값 없는 `.env.example`(필요한 변수 이름만: DB 접속 정보, 서버 포트)을 만든다. 비밀값은 커밋하지 않는다 (.gitignore, .env.example)
- [X] T004 [P] 로컬 개발용 PostgreSQL을 Docker Compose로 정의한다. 접속 정보는 비밀값이 아닌 로컬 전용 값만 쓴다 (docker-compose.yml)
- [X] T005 네 패키지 골격을 만든다. 각 `package.json`은 의존 방향 `domain ← application ← persistence / bootstrap-http`만 `dependencies`로 선언하고, `persistence`는 `bootstrap-http`를 참조하지 않는다. `persistence`는 자체 `dependencies`로 ORM(MikroORM)·PostgreSQL 드라이버·마이그레이션 도구와 DI 모듈용 `@nestjs/common`을 가지며 웹 의존성(`@nestjs/platform-express` 등)은 없다. MikroORM의 Nest 통합 패키지가 필요한지는 공식 문서로 확인한다 (packages/domain/package.json, packages/application/package.json, packages/persistence/package.json, apps/bootstrap-http/package.json)
- [X] T006 RED 게이트가 위반을 잡는지 보는 위반 픽스처를 만든다: `any` 사용, `@ts-ignore` 사용, 암묵적 any 파라미터, `domain`이 `application`을 import하는 파일. typecheck·lint를 실행해 **위반을 잡는 검사가 아직 없음**(설정 전이라 typecheck·lint가 없거나 위반을 통과시킴, Red)을 확인하고 기록한다 (packages/domain/src/__gate_fixture__.ts)
- [X] T007 GREEN 공통 `tsconfig.base.json`(`strict: true`, 완화 금지)을 만들어 네 패키지가 상속하게 하고, ESLint를 구성한다(`@typescript-eslint/no-explicit-any` 오류, `@ts-ignore`·`@ts-nocheck` 금지, Prettier 연동). 규칙 이름과 설정 형식은 설치한 버전의 공식 문서로 확인. 루트 스크립트가 Turborepo 태스크를 호출한다. T006 픽스처가 이제 typecheck·lint에서 **실패**함을 확인해 기록한다 (tsconfig.base.json, eslint.config.*, packages/*/tsconfig.json, apps/bootstrap-http/tsconfig.json)
- [X] T008 CHECK 계층 역방향 의존이 실제로 차단되는지 검증한다: (a) `domain`이 선언하지 않은 패키지를 import하면 pnpm 엄격 모드에서 실패하는지, (b) 역방향 `dependencies` 추가 시 Turborepo가 순환으로 실패하는지 확인한다. 차단되지 않는 경우가 있으면 ESLint `no-restricted-imports`로 보완하고 방식을 기록한다 (specs/001-ticket-create-get/tdd-log.md, eslint.config.*)
- [X] T009 [P] Jest를 패키지별로 설정한다(TypeScript 변환 방식과 Nest·MikroORM 데코레이터 메타데이터 동작은 공식 문서로 확인). 각 패키지에 자명한 테스트 하나로 `pnpm test`가 동작함을 확인한다. 통합·API 테스트 파일 이름 규칙을 정한다 (packages/*/jest.config.*, apps/bootstrap-http/jest.config.*)
- [X] T010 GREEN T006 픽스처를 삭제하고 `pnpm typecheck`, `pnpm lint`, `pnpm test`가 깨끗한 저장소에서 통과함을 확인한 뒤 커밋한다 (packages/domain/src/__gate_fixture__.ts 삭제)

**Checkpoint**: 게이트가 위반을 실제로 잡고, 깨끗한 상태에서는 통과한다.

---

## Phase 2: Foundational — domain, persistence, API 하네스 (plan B·C)

**목적**: 모든 사용자 스토리가 공유하는 도메인 규칙, 영속성, 앱 기동 기반. **완료 전에는 스토리 작업을 시작하지 않는다.**

### domain (프레임워크 없음, 순수 단위 테스트)

- [X] T011 [P] RED `Title` 테스트: 앞뒤 공백을 제거한 값을 보관, 제거 후 빈 값·공백뿐·`null`은 도메인 오류, **100자 허용·101자 거부**(제거 후 기준), 앞뒤 공백 때문에 100자를 넘긴 제목도 제거 후 100자 이하면 허용. C3·C5·V1·V2에 대응 (packages/domain/test/title.spec.ts)
- [X] T012 [P] RED 설명 정규화 테스트: 생략·`null`·`""`·공백뿐이면 `null`, **2000자 허용·2001자 거부**. C4·C5·V2에 대응. 설명 앞뒤 공백을 보존하는지와 2000자 검사 기준(정규화 전/후)은 문서에 없으므로 구현 전 사용자에게 확인하고 D-81에 반영한다 (packages/domain/test/description.spec.ts)
- [X] T013 [P] RED `Priority` 테스트: 값은 `LOW`/`MEDIUM`/`HIGH`/`URGENT`만 허용, 생략 시 `MEDIUM`, `null`·그 외 값은 도메인 오류. C1·V3에 대응 (packages/domain/test/priority.spec.ts)
- [X] T014 [P] RED `Position` 테스트: 컬럼 첫 카드의 키를 만든다, 마지막 키 뒤의 키는 항상 바이트 순서로 마지막 키보다 크다, 반복해도 단조 증가, 문자열 순서 키는 사전순(바이트 순서) 비교. 두 키 사이 계산과 키 길이 상한은 이 기능 범위 밖이다 (구현 시 확정) (packages/domain/test/position.spec.ts)
- [X] T015 [P] RED `Ticket.create()` 테스트: 공개 식별자 `ticketId`가 UUID v4 형식, 호출마다 다른 값(C6), 상태는 항상 `TODO`, 우선순위 기본 `MEDIUM`, 마감일 선택, 내부 PK를 갖지 않음. UUID 생성 방식(내장 기능 또는 라이브러리)은 공식 문서로 확인하며 `domain`에 프레임워크 의존을 넣지 않는다. 새 라이브러리가 필요하면 추가 전 사용자에게 확인 (packages/domain/test/ticket.spec.ts)
- [X] T016 RED T011~T015를 실행해 **모든 테스트가 모듈 미존재로 실패**함을 확인하고 tdd-log.md에 기록한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T017 [P] GREEN `Title`과 설명 정규화, 도메인 오류를 구현한다: 도메인 오류는 프레임워크를 모르는 클래스로 정의한다 (packages/domain/src/title.ts, packages/domain/src/description.ts, packages/domain/src/errors.ts)
- [X] T018 GREEN `Priority`를 구현한다: 문자열 enum 값과 기본값 `MEDIUM` (packages/domain/src/priority.ts)
- [X] T019 [P] GREEN `Position`을 구현한다: 첫 키와 마지막 키 뒤 키. 경계 조건 테스트를 통과시킨다 (packages/domain/src/position.ts)
- [X] T020 GREEN `Ticket.create()`와 `index.ts` export를 구현한다. T017~T019에 의존한다 (packages/domain/src/ticket.ts, packages/domain/src/index.ts)
- [X] T021 REFACTOR domain 패키지의 중복·명명을 정리한다. 테스트는 그대로 통과해야 하고, `domain`이 어떤 프레임워크도 import하지 않음을 확인해 커밋한다 (packages/domain/src/)

### persistence (Testcontainers Postgres 통합 테스트)

- [X] T022 [P] RED 테스트 헬퍼: Testcontainers로 Postgres를 띄우고 MikroORM을 초기화·마이그레이션 적용·정리하는 헬퍼를 만든다. Docker가 없는 환경에서는 명확히 실패해야 한다 (packages/persistence/test/helpers/postgres.ts)
- [X] T023 [P] RED 매퍼 테스트(DB 없음): 도메인 `Ticket` ↔ 영속성 엔티티 변환에서 `ticketId` ↔ `public_id` 대응, 우선순위 문자열 ↔ 숫자(`smallint`) 변환이 왕복해서 같은 값, 순서가 `LOW` < `MEDIUM` < `HIGH` < `URGENT`. 정확한 숫자 값은 이 테스트로 고정하고 지어내지 않는다. 도메인 타입에 내부 PK가 없음 (packages/persistence/test/ticket.mapper.spec.ts)
- [X] T024 [P] RED 마이그레이션 테스트: 적용 후 `ticket` 테이블이 다음 제약을 가진다 — `id` bigint 자동 증가 PK, `public_id` UUID 유니크, `title` 최대 100자 컬럼, `description` text 널 허용, `status` 문자열 + CHECK(`TODO`/`IN_PROGRESS`/`DONE`) 위반 시 거부, `priority` smallint, `due_at` timestamp 널 허용, `position` 문자열 `COLLATE "C"`(대문자 키가 소문자 키보다 앞에 정렬되는 바이트 순서로 검증), (`status`, `position`) 유니크 위반 시 거부, `created_at`·`updated_at`은 ORM 훅이 채움 (packages/persistence/test/migration.int-spec.ts)
- [X] T025 [P] RED 리포지토리 통합 테스트: (a) 저장 후 `ticketId`로 조회하면 도메인 `Ticket`이 같은 값(G1의 기반), (b) 없는 `ticketId`는 `null`, (c) 컬럼(상태)별 마지막 순서 키 조회(빈 컬럼은 없음), (d) 같은 (상태, 순서 키) 저장은 도메인/애플리케이션이 이해하는 충돌 오류로 변환됨, (e) 새 티켓을 이어서 저장하면 순서 키가 생성 순으로 증가(D-79), (f) 조회 결과 어디에도 내부 PK가 없음 (packages/persistence/test/ticket.repository.int-spec.ts)
- [X] T026 RED T022~T025를 실행해 **모듈 미존재 또는 스키마 없음으로 실패**함을 확인하고 기록한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T027 [P] GREEN 애플리케이션 포트를 정의한다: `TicketRepository` 인터페이스(저장, `ticketId`로 조회, 상태별 마지막 순서 키 조회)와 Symbol 토큰, 순서 키 충돌 오류 `PositionConflictError`. `application`은 `@nestjs/common`만 허용하고 웹 의존성은 없다 (packages/application/src/ticket.repository.ts, packages/application/src/tokens.ts, packages/application/src/errors.ts)
- [X] T028 [P] GREEN 영속성 엔티티와 매퍼를 구현한다. 내부 PK는 이 엔티티에만 두고 `persistence` 밖으로 MikroORM 타입을 노출하지 않는다 (packages/persistence/src/ticket.entity.ts, packages/persistence/src/ticket.mapper.ts)
- [X] T029 GREEN 첫 마이그레이션을 작성한다(T024 제약 전부, `position`에만 `COLLATE "C"` 명시). 마이그레이션은 로컬·테스트 DB에서만 실행한다 (packages/persistence/src/migrations/)
- [X] T030 GREEN 리포지토리 어댑터를 구현한다: 유니크 위반을 T027의 `PositionConflictError`로 변환. 어댑터를 `TicketRepository` 토큰에 바인딩해 제공하는 Nest 모듈과 ORM 설정 export를 함께 만든다(`bootstrap-http`는 이 모듈을 조립만 한다). T027~T029에 의존 (packages/persistence/src/mikro-orm-ticket.repository.ts, packages/persistence/src/persistence.module.ts, packages/persistence/src/index.ts)
- [X] T031 REFACTOR persistence 정리. `persistence`가 `bootstrap-http`를 import하지 않고 MikroORM 타입이 밖으로 새지 않음을 확인해 커밋한다 (packages/persistence/src/)

### API 하네스와 기동 (bootstrap-http)

- [X] T032 [P] RED 기동 마이그레이션 테스트: 정상 DB에서는 서버 기동 시 마이그레이션이 적용되고, 마이그레이션이 실패하면 **기동이 중단**된다(D-72, 스키마 자동 롤백은 하지 않음) (apps/bootstrap-http/test/startup.int-spec.ts)
- [X] T033 [P] RED API 테스트 하네스와 스모크 테스트: Testcontainers DB로 Nest 앱을 만드는 헬퍼, 전역 접두사 `/v1` 확인(`/v1` 아래 없는 경로는 프레임워크 기본 404, 접두사 없는 경로는 404) (apps/bootstrap-http/test/helpers/app.ts, apps/bootstrap-http/test/smoke.api-spec.ts)
- [X] T034 RED T032·T033 실행 후 **앱 모듈 미존재로 실패**함을 확인하고 기록한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T035 GREEN Nest 앱 뼈대를 구현한다: `AppModule`, 전역 접두사 `/v1`, 환경변수 기반 DB 설정(값은 `.env`, 커밋 금지), 마이그레이션 CLI 설정(파일은 `persistence`를 가리킴), 기동 시 마이그레이션 실행, 실패 시 기동 중단. 웹 계층은 이 앱에만 둔다 (apps/bootstrap-http/src/main.ts, apps/bootstrap-http/src/app.module.ts, apps/bootstrap-http/src/mikro-orm.config.ts)
- [X] T036 REFACTOR 하네스·기동 코드를 정리하고 게이트 통과 후 커밋한다 (apps/bootstrap-http/src/, apps/bootstrap-http/test/helpers/)

**Checkpoint**: domain 단위 테스트, persistence 통합 테스트, 앱 기동 테스트가 통과한다. 이제 스토리를 시작할 수 있다.

---

## Phase 3: User Story 1 — 새 티켓 만들기 (Priority: P1) 🎯 MVP

**Goal**: 제목만으로 티켓을 만들면 `TODO`·`MEDIUM`·새 `ticketId`를 가진 티켓이 `TODO` 컬럼 맨 뒤에 만들어진다.

**Independent Test**: 제목만 담아 `POST /v1/tickets`를 호출해 `201`과 기본값 응답을 확인한다.

> `application` 유스케이스 단위 테스트는 만들지 않는다 (2차 범위). API 테스트가 전체 경로를 검증한다. 입력 검증 실패 케이스(V1~V8)는 US3에서 다룬다.

- [X] T037 [P] [US1] RED 생성 성공 API 테스트: C1(제목만 → `201`, `status`=`TODO`, `priority`=`MEDIUM`, 새 `ticketId`, 응답에 내부 PK·`position` 없음), C2(제목·설명·우선순위 `HIGH`·마감일 → 입력값 그대로), C3(제목 앞뒤 공백 → 제거된 제목), C4(설명 `""`·공백뿐 → `description`=`null`), C5(제목 정확히 100자·설명 정확히 2000자 → `201`), C6(같은 내용 두 번 → 서로 다른 `ticketId` 두 건), C7(이름이 다른 미지 필드 포함 → 무시하고 `201`). 응답 형태는 [contracts/tickets-api.md](contracts/tickets-api.md) (apps/bootstrap-http/test/tickets.create.api-spec.ts)
- [X] T038 [P] [US1] RED 새 티켓 위치 API 테스트: 티켓을 여러 개 만든 뒤 DB에서 같은 `TODO` 컬럼의 순서 키가 생성 순으로 증가하고 **기존 카드의 키는 바뀌지 않는지** 확인(D-79, FR-009) (apps/bootstrap-http/test/tickets.create-order.api-spec.ts)
- [X] T039 [P] [US1] RED 생성 충돌 API 테스트: FR-013·V9 — 순서 키 충돌이 재시도 상수(최초 시도 후 최대 3회, D-84)만큼 반복돼도 계속되면 `409`, `code`=`POSITION_CONFLICT`, 오류 응답 형식(`statusCode`, `code`, `message`). 충돌 상황은 리포지토리 프로바이더를 테스트에서 대체해 만든다. 재시도 후 성공하는 경우(1~3회째 충돌 뒤 성공)도 검증 (apps/bootstrap-http/test/tickets.create-conflict.api-spec.ts)
- [X] T040 [US1] RED T037~T039를 실행해 **엔드포인트 미존재(404)로 실패**함을 확인하고 기록한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T041 [P] [US1] GREEN `CreateTicket` 유스케이스: 도메인으로 티켓 생성, 상태별 마지막 순서 키를 조회해 `Position`으로 맨 뒤 키를 계산, 저장, `PositionConflictError` 시 재시도(재시도 횟수는 상수 하나, D-69·D-84), 초과하면 오류를 그대로 전달. 유스케이스 토큰 정의 (packages/application/src/create-ticket.use-case.ts, packages/application/src/application.module.ts, packages/application/src/index.ts)
- [X] T042 [P] [US1] GREEN 응답 표현: 도메인 `Ticket` → 응답(`ticketId`, `title`, `description`, `status`, `priority`, `dueAt`, `createdAt`, `updatedAt`). 내부 PK와 `position`은 포함하지 않는다(D-80). camelCase, 시각은 UTC ISO 8601. 서버 스키마 상세는 구현하며 OpenAPI로 확정 (apps/bootstrap-http/src/tickets/dto/ticket-response.dto.ts)
- [X] T043 [US1] GREEN 생성 요청 DTO(`title`, `description`, `priority`, `dueAt`; Swagger 데코레이터 포함)와 `TicketsController`의 `POST /tickets`(`201`), 충돌 오류 → `409 POSITION_CONFLICT` 오류 응답 변환, 모듈 조립. 정의되지 않은 필드는 무시한다(D-81). T041·T042에 의존 (apps/bootstrap-http/src/tickets/dto/create-ticket.dto.ts, apps/bootstrap-http/src/tickets/tickets.controller.ts, apps/bootstrap-http/src/tickets/tickets.module.ts, apps/bootstrap-http/src/common/domain-error.filter.ts)
- [X] T044 [US1] REFACTOR 생성 경로를 정리한다(중복 제거, 명명, 계층 경계 재확인). T037~T039와 전체 게이트가 통과해야 커밋 (packages/application/src/, apps/bootstrap-http/src/)

**Checkpoint**: US1이 독립적으로 동작한다. 여기서 MVP 데모가 가능하다.

---

## Phase 4: User Story 2 — 티켓 한 건 조회하기 (Priority: P1)

**Goal**: 공개 식별자로 티켓 한 건을 조회한다.

**Independent Test**: 티켓을 만들고 응답의 `ticketId`로 조회해 같은 값이 돌아오는지 확인한다.

- [X] T045 [P] [US2] RED 조회 API 테스트(TC-API-014~017): G1(존재하는 `ticketId` → `200`, 생성 시 값과 일치, 내부 PK·`position` 없음), G2(UUID 형식이나 없는 티켓 → `404`, `TICKET_NOT_FOUND`), G3(UUID 형식이 아닌 값 → `400`, `INVALID_TICKET_ID`). 오류 응답 형식 확인 (apps/bootstrap-http/test/tickets.get.api-spec.ts)
- [X] T046 [US2] RED T045를 실행해 **GET 엔드포인트 미존재로 실패**함을 확인하고 기록한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T047 [P] [US2] GREEN `GetTicket` 유스케이스: `ticketId`로 조회, 없으면 `TicketNotFoundError`. 오류 클래스는 `application`에 둔다 (packages/application/src/get-ticket.use-case.ts, packages/application/src/errors.ts)
- [X] T048 [US2] GREEN `GET /tickets/:ticketId`: 경로 값이 UUID 형식이 아니면 `INVALID_TICKET_ID`(`400`), `TicketNotFoundError` → `404 TICKET_NOT_FOUND`로 변환하는 필터 규칙 추가. T047에 의존 (apps/bootstrap-http/src/tickets/tickets.controller.ts, apps/bootstrap-http/src/common/domain-error.filter.ts)
- [X] T049 [US2] REFACTOR 조회 경로와 오류 변환 정리, 전체 게이트 통과 후 커밋 (packages/application/src/, apps/bootstrap-http/src/)

**Checkpoint**: US1과 US2가 각각 독립적으로 동작한다.

---

## Phase 5: User Story 3 — 잘못된 생성 요청 거부하기 (Priority: P2)

**Goal**: 잘못된 요청은 원인을 알 수 있는 오류를 받고 티켓은 만들어지지 않는다.

**Independent Test**: 검증 규칙을 하나씩 위반하는 요청을 보내 모두 오류 응답을 받고 저장된 티켓이 없음을 확인한다.

- [X] T050 [P] [US3] RED 검증 실패 API 테스트(TC-API-018~021, 026, 027): V1(제목 없음·`null`·`""`·공백뿐 → `400` `VALIDATION_FAILED`, `details`에 `title`), V2(제목 101자·설명 2001자), V3(우선순위가 허용 값 밖, `null`), V4(`dueAt`이 ISO 8601 아님) — 모두 `400` `VALIDATION_FAILED`이며 실패 뒤 DB에 티켓이 0건 (apps/bootstrap-http/test/tickets.create-validation.api-spec.ts)
- [X] T051 [P] [US3] RED 서버 지정 값·범위 밖 필드 API 테스트(TC-API-022, 023): V5(`ticketId`·`status`·`position`·`createdAt`·`updatedAt` 포함 → `400` `VALIDATION_FAILED`, 무시하지 않고 거부), V6(`tags` 포함 → `400` `VALIDATION_FAILED`, 이 슬라이스 한정 임시 규칙) (apps/bootstrap-http/test/tickets.create-rejected-fields.api-spec.ts)
- [X] T052 [P] [US3] RED 본문·미디어 타입 API 테스트(TC-API-024, 025): V7(올바르지 않은 JSON → `400` `INVALID_REQUEST_BODY`), V8(`Content-Type`이 JSON이 아님 → `415` `UNSUPPORTED_MEDIA_TYPE`). 프레임워크 기본 동작이 다르면 기대값을 지어내지 말고 실제 동작을 확인해 사용자에게 보고한다 (apps/bootstrap-http/test/tickets.create-body.api-spec.ts)
- [X] T053 [US3] RED T050~T052를 실행해 **검증 미구현으로 실패**함을 확인하고 기록한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T054 [P] [US3] GREEN 요청 형식 검증: DTO 검증 규칙(형식·타입·enum·`dueAt` ISO 8601), 검증 실패를 오류 응답 형식(`statusCode`, `code`=`VALIDATION_FAILED`, `message`, 필드별 `details`)으로 변환, 정의되지 않은 필드는 제거해 무시 (apps/bootstrap-http/src/tickets/dto/create-ticket.dto.ts, apps/bootstrap-http/src/common/validation.ts)
- [X] T055 [US3] GREEN 서버 지정 값과 `tags`를 거부하는 검사를 추가한다. 미지 필드 무시(D-81)와 충돌하지 않게 이름 목록 기반으로 처리한다 (apps/bootstrap-http/src/tickets/dto/create-ticket.dto.ts, apps/bootstrap-http/src/common/validation.ts)
- [X] T056 [US3] GREEN 도메인 검증 오류(`Title`·설명·`Priority` 위반)를 `400 VALIDATION_FAILED`로 변환하는 필터 규칙, 본문 파싱 오류 → `INVALID_REQUEST_BODY`, 미디어 타입 오류 → `415` `UNSUPPORTED_MEDIA_TYPE`. T054·T055에 의존 (apps/bootstrap-http/src/common/domain-error.filter.ts, apps/bootstrap-http/src/common/error-codes.ts)
- [X] T057 [US3] REFACTOR 검증·오류 변환 코드를 정리한다. 도메인 규칙은 `domain`에, 형식 검증과 오류 코드 변환은 `bootstrap-http`에만 있는지 확인하고 전체 게이트 통과 후 커밋 (apps/bootstrap-http/src/, packages/domain/src/)

**Checkpoint**: 모든 사용자 스토리가 독립적으로 동작하고 contracts의 모든 케이스가 테스트로 검증된다.

---

## Phase 6: Polish & 마무리 (plan F)

- [X] T058 CHECK 케이스 커버리지를 확인한다: C1~C7, V1~V9, G1~G3가 각각 하나 이상의 통과하는 테스트에 대응하는지 표로 tdd-log.md에 기록한다. 빠진 케이스는 RED부터 다시 진행한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T059 CHECK 응답 어디에도 내부 PK와 `position`이 없는지(SC-003), `domain`이 프레임워크를 import하지 않는지(SC-005), 모든 RED 실패 기록이 tdd-log.md에 있는지(SC-004)를 확인한다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T060 CHECK [quickstart.md](quickstart.md)의 품질 게이트와 수동 시나리오 1~6을 실제로 실행해 결과를 기록한다. 로컬 DB는 Docker Compose로 띄운다 (specs/001-ticket-create-get/tdd-log.md)
- [X] T061 [P] DOC 구현 중 확정한 값을 정본 문서에 반영한다: Node 버전(`docs/trd/05-dev-environment.md`의 미결과 `docs/open_questions.md`의 해당 항목 삭제), ESLint 설정 형식·규칙 이름(`docs/trd/05-dev-environment.md`), 계층 역방향 검사 방식(`docs/trd/04-layer-boundaries.md`), 우선순위 숫자 매핑(`docs/data_model.md`), `415` 동작과 서버 지정 값·`tags` 거부의 오류 코드(`docs/api_spec.md`) (docs/)
- [X] T062 DOC 위 변경과 구현 중 생긴 결정을 `docs/decision_log.md`에 근거와 함께 추가하고 `docs/changelog.md`에 기록한다. 문서 한 개는 200줄을 넘기지 않는다. `docs/open_questions.md`에서 해소된 항목을 지운다 (docs/decision_log.md, docs/changelog.md, docs/open_questions.md)
- [X] T063 DOC `spec.md`의 Status를 갱신하고 `tags` 거부 임시 규칙(태그 기능에서 폐기)을 spec 또는 문서에 다음 기능 이월 항목으로 남긴다 (specs/001-ticket-create-get/spec.md)
- [X] T064 최종 `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`를 실행해 모두 통과함을 확인하고 커밋한다 (전체)

---

## 의존 관계와 실행 순서

- **Phase 1 → Phase 2 → Phase 3 → (Phase 4, Phase 5) → Phase 6**. Phase 2 완료 전에는 스토리를 시작하지 않는다.
- Phase 2 내부: domain(T011~T021) → persistence(T022~T031). `persistence`는 `domain`과 T027의 포트에 의존한다. API 하네스(T032~T036)는 persistence 완료 후.
- Phase 4는 Phase 3의 컨트롤러·필터에 의존한다(같은 파일 수정). Phase 5는 Phase 3 완료 후 시작하며 Phase 4와 파일이 겹치므로(`tickets.controller.ts`, `domain-error.filter.ts`) 순차 진행을 권한다.
- 각 스토리 안에서: RED 테스트 → RED 확인 → GREEN → REFACTOR.

## 병렬 예시

```text
Phase 2 domain RED:    T011, T012, T013, T014, T015 (서로 다른 테스트 파일)
Phase 2 domain GREEN:  T017과 T019 병렬 (T018은 T017의 오류 클래스 뒤, T020은 이들 뒤)
Phase 2 persistence:   T022, T023, T024, T025 (RED 작성), T027, T028 (GREEN 일부)
Phase 3 RED:           T037, T038, T039
Phase 5 RED:           T050, T051, T052
```

## 구현 전략

- **MVP**: Phase 1~3 (US1)까지 끝내면 티켓 생성이 동작한다. 여기서 검증·데모한다.
- **증분 전달**: US2(조회) → US3(검증) 순으로 추가한다. 각 단계는 게이트가 통과한 상태로 커밋한다.
- **주의**: US1에서는 유효한 입력만 다루므로, 도메인 검증 오류는 US3의 필터가 생기기 전까지 `400`으로 변환되지 않는다. 이는 의도된 순서이며 US3에서 해결한다.
- [X] T065 CHECK [docs/test_cases.md](../../docs/test_cases.md)의 ✅/⏳ 표시와 현황 수치가 실제 통과한 테스트와 일치하는지 확인하고, 이 기능의 API 케이스(TC-API-014~027)가 모두 ✅인지 확인한다 (docs/test_cases.md, docs/test_cases/03-api.md)
