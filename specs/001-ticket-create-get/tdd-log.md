# TDD 기록: 티켓 생성과 단건 조회

각 RED 태스크의 실패 확인 결과와 CHECK 태스크의 확인 결과를 기록한다 (SC-004). 형식: `T### 날짜 — 실행 명령 — 실패 이유(또는 확인 결과)`.

## 기록


### T001 (2026-09-21) — Node LTS 확인
- 출처: https://nodejs.org/dist/index.json (공식 릴리스 인덱스)
- 결과: 최신 LTS는 **v24.21.0 (Krypton, 2026-09-07)**. v22는 v22.23.2 (Jod)로 유지보수 LTS.
- 결정: 사용자가 v24 선택. `.nvmrc`에는 정확한 버전 `24.21.0`을 고정한다. `nvm install 24.21.0`으로 설치, 체크섬 일치 확인.
- 환경 메모: nvm v22의 corepack pnpm 셸(12.4.1 캐시에 `pnpm.cjs` 없음)이 깨져 있어 이 세션에서는 `~/.local/bin/pnpm`(12.4.1)을 PATH 앞에 두고 사용. 시스템 설정은 변경하지 않음.
- 환경 메모: Docker 데몬이 꺼져 있음(Testcontainers 필요 태스크 T022 이후는 Docker 실행 필요).

### T006 (2026-09-21) — RED: 게이트가 위반을 잡지 못함
- 픽스처: `packages/domain/src/__gate_fixture__.ts` (`any`, 암묵적 any, `@ts-ignore`, `domain`→`application` import)
- 실행: `pnpm typecheck`, `pnpm lint`, `pnpm test`
- 결과(Red): 세 명령 모두 `Tasks: 0 successful, 0 total`로 성공 종료. 검사가 하나도 실행되지 않아 위반이 통과됨.
- 참고: turbo가 `packageManager` 필드를 요구해 `pnpm@12.4.1`을 명시(설치본 기준. 레지스트리 최신은 12.5.1이나 동작 확인된 설치본 유지).

### T007 (2026-09-21) — GREEN: 게이트가 위반을 잡음
- 설정: `tsconfig.base.json`(strict), 패키지별 tsconfig(application·persistence·bootstrap-http는 데코레이터 플래그), ESLint(`no-explicit-any` error, `@ts-ignore`·`@ts-nocheck` 금지), Prettier.
- `pnpm typecheck` 결과: `TS7006 암묵적 any`, `TS2307 '@todo/application' 없음(domain이 선언하지 않은 의존)`으로 **실패**.
- `pnpm lint` 결과: `no-explicit-any`, `ban-ts-comment(@ts-ignore)`로 **실패**.
- 버전 확인 사항: `typescript` 최신은 7.0.2지만 `typescript-eslint@8.70.0`(peer `<6.1.0`)·`ts-jest@29.4.12`(peer `<7`)와 맞지 않아 `~6.0.3`으로 고정. eslint 10.11.0, prettier 3.9.8.

### T008 (2026-09-21) — CHECK: 계층 역방향 의존 차단
- (a) `domain`이 선언하지 않은 패키지를 import → typecheck `TS2307`로 실패(pnpm 엄격 모드).
- (b) `domain`의 `dependencies`에 `@todo/application`을 추가 → `turbo run typecheck`가 `Cyclic dependency detected`로 실패. (실험 후 원복)
- 결론: 패키지 `dependencies`만으로 역방향이 차단됨. 추가 ESLint `no-restricted-imports`는 도입하지 않음(필요해지면 추가).

### T009 (2026-09-21) — CHECK: Jest에서 ESM 전용 패키지 import 스파이크
- 배경: `@nestjs/*` 12.0.3, `@mikro-orm/*` 7.2.1은 ESM 전용(`"type": "module"`). Nest 공식 문서는 "CommonJS 앱은 `require(esm)`으로 계속 동작, CommonJS 프로젝트는 계속 Jest"라고 안내([릴리스 노트](https://github.com/nestjs/nest/releases/tag/v12.0.0), [마이그레이션 가이드](https://docs.nestjs.com/migration-guide)).
- 실험 1(플래그 없음, Node 24.21.0): `packages/application/test/smoke.spec.ts`가 `@nestjs/common` import에서 실패 — `Must use import to load ES Module`. Jest 문서(https://jestjs.io/docs/ecmascript-modules)는 Node 24.9+에서 플래그 없이 `require(esm)`이 된다고 하나 실제로는 불가. `vm.SourceTextModule`이 플래그 없이는 `undefined`.
- 실험 2(`NODE_OPTIONS=--experimental-vm-modules`): 통과(Nest `@Injectable` 메타데이터 읽기 성공, ExperimentalWarning만 출력).
- 결정: Jest + CommonJS 유지, 테스트 스크립트에만 `--experimental-vm-modules`를 붙임(application·persistence·bootstrap-http). Vitest 전환은 하지 않음. **T061/T062에서 `docs/trd/02-tech-stack-detail.md`(테스트 절)와 결정 로그에 반영할 것.**
- 부가 결정: ts-jest는 `nodenext`에서 `isolatedModules: true`를 요구해 `tsconfig.base.json`에 설정. TS 6은 `@types`를 자동 포함하지 않아 `types: ["node", "jest"]` 명시.
- 부가 결정: pnpm 12는 의존성 빌드 스크립트를 기본 차단(`ERR_PNPM_IGNORED_BUILDS`). Jest 내부 의존성 `@parcel/watcher`, `unrs-resolver`는 사전 빌드 바이너리를 쓰므로 `allowBuilds: false`로 거부(최소 권한)하고 정상 동작 확인.

### T016 (2026-09-21) — RED: domain 테스트 5개 스위트
- 작성: `title`, `description`, `priority`, `position`, `ticket` 테스트(C1·C2·C3·C4·C5·C6·V1·V2·V3 대응).
- 실행: `pnpm test`(packages/domain)
- 결과(Red): `Test Suites: 5 failed, 5 total` — 모두 `Cannot find module '../src/errors'`(구현 없음).

### T017~T021 (2026-09-21) — GREEN·REFACTOR: domain 구현
- 결과: `Test Suites: 5 passed, Tests: 55 passed`. typecheck·lint·prettier 통과.
- `domain`의 외부 import는 `node:crypto`(내장, UUID v4 `randomUUID()`)뿐. 프레임워크·라이브러리 의존 없음(SC-005). 새 의존성 추가 없음.
- **가정(사용자 확인 전, A1)**: 설명은 앞뒤 공백을 다듬지 않고 그대로 저장, 2000자 검사는 저장할 값 기준. 질문 도구가 거절되어 기본 제안으로 진행. 변경이 필요하면 `description.ts`와 테스트만 수정하면 됨. Phase 6에서 D-81 보완 여부 확인.
- **가정**: 제목·설명 길이는 UTF-16 코드 유닛이 아니라 문자(코드 포인트) 수 기준(DB 문자 길이와 동일). 이모지 테스트로 고정.
- **설계**: `Position`은 머리 문자(a-z) + 정수 자릿수 + 소수부 형식(fractional-indexing 계열). 이번 범위는 `first()`, `after()`, `from()`만. 소수부 키 뒤 계산도 테스트. 두 키 사이 계산·길이 상한은 카드 이동 기능에서 확정.

### T022~T026 (2026-09-21) — RED: persistence 테스트
- 사전 작업(tasks에 없던 항목, TDD로 처리): 매퍼가 저장된 값에서 도메인 `Ticket`을 복원하려면 `Ticket.rehydrate()`와 `createdAt`·`updatedAt`이 필요. domain 테스트 4개를 먼저 추가해 Red(3개 실패: `rehydrate` 없음) 확인 후 구현, domain 59개 통과.
- 작성: `test/helpers/postgres.ts`(Testcontainers, `postgres:18`), `ticket.mapper.spec.ts`, `migration.int-spec.ts`, `ticket.repository.int-spec.ts`.
- 실행: `NODE_OPTIONS=--experimental-vm-modules jest`(packages/persistence)
- 결과(Red): `Test Suites: 3 failed, 3 total` — `Cannot find module '../src/ticket.mapper'`, `'../src/mikro-orm-ticket.repository'`, `'../../src/orm.config'`.
- Docker Desktop이 꺼져 있어 `open -a Docker`로 실행(6초, server 28.4.0).

### T027~T031 (2026-09-21) — GREEN·REFACTOR: application 포트, persistence 구현
- 결과: persistence `Test Suites: 3 passed, Tests: 25 passed`(이미지 다운로드 포함 64초, 이후 실행은 더 빠름). domain 59개, 전체 `pnpm typecheck`·`lint`·`test`(7/7)·`prettier --check` 통과.
- 구현 결정(구현 중 확정, Phase 6에서 문서 반영):
  - 엔티티는 MikroORM 7 `defineEntity`(데코레이터·메타데이터 제공자 불필요)로 정의하고 `setClass`로 구체 클래스를 연결. 스키마의 정본은 손으로 쓴 마이그레이션(`snapshot: false`).
  - `@mikro-orm/nestjs`는 도입하지 않음(불필요). `PersistenceModule.forRoot()`가 `MikroORM.init`과 `TICKET_REPOSITORY` 어댑터를 제공. 확정 스택 밖 패키지를 추가하지 않음.
  - 시각 컬럼은 `timestamptz`(UTC 순간 저장). `data_model.md`는 "timestamp"로만 적혀 있어 갱신 필요.
  - `status`·`position`은 길이를 지어내지 않고 `text`. `position`만 `COLLATE "C"`. 순서 키 길이 상한은 미결로 유지.
  - 우선순위 숫자: LOW=1, MEDIUM=2, HIGH=3, URGENT=4(매퍼 테스트로 고정). `data_model.md`의 "정확한 값은 구현 시 확정" 해소 필요.
  - 유니크 제약 이름을 명시(`ticket_status_position_key`)하고 그 이름으로 `PositionConflictError`를 판별. `public_id` 중복 등 다른 유니크 위반은 충돌 오류로 바꾸지 않음.
  - 마이그레이션은 파일 탐색 대신 `migrationsList`로 등록(Jest·번들과 무관하게 동작).
  - `persistence` 공개 표면은 `PersistenceModule`, `DatabaseSettings`만(MikroORM 타입 비노출, TRD 04). 기동 시 마이그레이션 실행용 래퍼는 T035에서 추가.
  - `application`은 단위 테스트를 만들지 않으므로 `jest --passWithNoTests`. 검증은 Phase E API 테스트가 맡음.

### T032~T034 (2026-09-21) — RED: 기동 마이그레이션·API 하네스
- 작성: `test/startup.int-spec.ts`(정상 기동 시 ticket 테이블 생성 / 마이그레이션 실패 시 기동 중단), `test/smoke.api-spec.ts`(없는 경로 404, 접두사 없는 경로 404), `test/helpers/app.ts`(Testcontainers + 실제 Nest 앱 + Node 내장 fetch).
- 결과(Red): `Test Suites: 2 failed` — `Cannot find module '../src/app.factory'`.
- 추가 작업(tasks에 없던 항목, TDD로 처리): 환경변수 파싱 `src/config.ts`. `test/config.spec.ts`(9개)를 먼저 작성해 Red(`Cannot find module '../src/config'`) 확인 후 구현.

### T035~T036 (2026-09-21) — GREEN·REFACTOR: Nest 앱 뼈대
- 결과: bootstrap-http `Test Suites: 3 passed, Tests: 13 passed`. 전체 typecheck·lint·test(7/7)·build·prettier 통과.
- 구현: `AppModule.forRoot(settings)`(PersistenceModule 조립 + `StartupMigration`이 `onModuleInit`에서 마이그레이션 적용, 실패 시 기동 중단), `createApp`(전역 접두사 `/v1`), `main.ts`(환경변수로 설정, 없으면 어떤 변수가 빠졌는지 알려 주며 실패).
- `persistence`에 `DatabaseMigrator`(마이그레이션 실행 래퍼) 추가·export. 웹 계층이 MikroORM 타입을 알지 않도록 함.
- **의도적으로 미룬 것**: T035에 적힌 `mikro-orm.config.ts`(MikroORM CLI용 설정)는 이번 기능에서 CLI를 쓰지 않아(첫 마이그레이션은 직접 작성) 만들지 않음. 이후 마이그레이션 생성이 필요한 기능에서 `@mikro-orm/cli`와 함께 도입.
- 의존성: `@nestjs/core|platform-express|swagger|testing` 12.x, `class-validator` 0.15.1, `class-transformer` 0.5.1 (Nest 12 peer 확인). `supertest`는 쓰지 않고 Node 내장 `fetch`로 실제 포트에 요청. `@scarf/scarf`(텔레메트리) 빌드 스크립트는 거부.
- `dev` 스크립트: `tsc` 빌드 후 `node --env-file=../../.env dist/main.js`(루트 `.env` 사용).

### T037~T040 (2026-09-21) — RED: US1 생성 API 테스트
- 작성: `tickets.create.api-spec.ts`(C1~C7), `tickets.create-order.api-spec.ts`(D-79·FR-009), `tickets.create-conflict.api-spec.ts`(V9·FR-013, 저장소 대역으로 충돌 재현: 4번 시도 후 409, 1~3번 충돌 뒤 성공은 201, 시도마다 마지막 키 재조회).
- 선행 리팩터링(동작 보존): `configureApp`을 분리해 테스트 앱과 실제 앱이 같은 설정을 쓰게 함. 기존 13개 테스트 그대로 통과.
- 결과(Red): `Test Suites: 3 failed, Tests: 16 failed` — `Expected: 201 / Received: 404`(엔드포인트 없음), 저장소 호출 횟수 0.

### T041~T044 (2026-09-21) — GREEN·REFACTOR: US1 티켓 생성
- 결과: bootstrap-http `Tests: 29 passed`(US1 API 16개 포함), domain 59, persistence 25. typecheck·lint·test·build·prettier 통과.
- 구현: `application`의 `CreateTicket`(TODO 컬럼 마지막 키 뒤에 추가, `PositionConflictError` 시 최초 후 최대 3회 재시도, 시도마다 마지막 키 재조회, `MAX_POSITION_RETRIES` 상수 하나), `bootstrap-http`의 `CreateTicketDto`(Swagger 데코레이터), `TicketResponse`(내부 PK·position 비노출), `TicketsController` `POST /v1/tickets`, `DomainErrorFilter`(`PositionConflictError` → `409 POSITION_CONFLICT`).
- 결정: `ApplicationModule`은 만들지 않음. `AppModule`이 `CreateTicket`을 직접 provider로 등록(YAGNI).
- 하네스 결정: TS 6에서 `fetch().json()`이 `unknown`이라 `any` 없이 쓰려고 테스트 하네스 경계(`test/helpers/http.ts`)에서 응답 본문 타입을 한 번만 지정.
- **과정상 실수 기록**: T036 커밋(`e28e984`)이 lint 실패 상태로 만들어졌다(게이트 결과와 무관하게 커밋하도록 명령을 이어 붙임). `4f1d7bb`에서 수정. 이후 커밋은 모든 게이트를 `&&`로 묶어 통과 시에만 실행.
- 의도된 상태: 입력 검증은 US3 범위라 US1에서는 유효한 입력만 다룸. 잘못된 요청은 지금은 `400`으로 변환되지 않음.

### T045~T049 (2026-09-21) — US2 티켓 조회
- 사전 정의: TC-API-014~017(`docs/test_cases/03-api.md`), 테스트 이름에 TC ID 포함.
- RED(T046): `tickets.get.api-spec.ts` 6개 모두 `Expected 200|400 / Received 404`(GET 엔드포인트 없음)로 실패.
- GREEN(T047~T048): `application`의 `GetTicket`·`TicketNotFoundError`, `bootstrap-http`의 `GET /v1/tickets/:ticketId`, `ParseTicketIdPipe`(UUID 형식 검사, 존재 여부는 유스케이스 몫), `InvalidTicketIdError`, `DomainErrorFilter`에 `404 TICKET_NOT_FOUND`·`400 INVALID_TICKET_ID` 추가. 6개 통과.
- 결정: UUID 형식은 버전을 가리지 않고 8-4-4-4-12 16진수(대소문자 무관)로 검사. 생성은 v4지만 조회는 형식 검사만 한다.
