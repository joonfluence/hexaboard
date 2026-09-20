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
