# To-do-app Constitution

프로젝트 규칙의 상세는 `docs/`가 정본이다. 이 헌법은 Spec Kit 산출물(spec, plan, tasks)이 반드시 지켜야 할 원칙만 담고, 상세 내용은 링크로 참조한다.

## Core Principles

### I. 문서가 정본이다 (Docs Are Canonical)

- 요구사항·설계의 정본은 `docs/`다. `docs/README.md`의 문서 지도를 진입점으로 삼는다.
- spec, plan, tasks는 `docs/` 내용을 복제하지 않고 문서 경로로 참조한다.
- `docs/open_questions.md`에 있는 항목은 구현 전에 사용자에게 묻는다. 확정되지 않은 것을 지어내지 않는다.
- 구현 중 결정이 생기면 해당 주제 문서, `open_questions.md`, `decision_log.md`, `changelog.md`를 함께 갱신한다.
- 도메인 용어는 "티켓"이다 ("할 일"이 아님).

근거: 같은 내용이 여러 곳에 있으면 어긋난다. 결정의 단일 출처를 유지해야 AI 에이전트가 낡은 정보로 구현하지 않는다.

### II. 계층 경계는 패키지로 강제한다 (Layer Boundaries)

- 백엔드는 헥사고날이며 의존 방향은 `domain ← application ← persistence / bootstrap-http`다.
- 경계는 폴더 컨벤션이 아니라 패키지 `dependencies`로 강제한다. 역방향 import를 추가하지 않는다.
- `domain`은 프레임워크를 모른다. 컨트롤러·DTO 등 웹 계층은 `bootstrap-http`에만 둔다. `persistence`는 `bootstrap-http`를 import하지 않는다.
- `web`은 서버 패키지를 import하지 않고 `api-client`만 사용한다.
- 세부 규칙은 [docs/trd/04-layer-boundaries.md](../../docs/trd/04-layer-boundaries.md)를 따른다.

근거: 경계 위반이 빌드·설치 단계에서 오류로 드러나야 학습용 아키텍처가 무너지지 않는다.

### III. 테스트 먼저 (Test-First, NON-NEGOTIABLE)

- 모든 프로덕션 코드는 실패하는 테스트를 먼저 작성한 뒤에 구현한다. Red → Green → Refactor 순서를 지킨다.
- 실패(Red)를 실제로 확인하기 전에는 구현을 시작하지 않는다.
- tasks에서 테스트 태스크는 대응하는 구현 태스크보다 항상 앞선다.
- 테스트 범위는 계층별로 정한다: `domain`은 순수 단위 테스트, `persistence`는 Testcontainers의 실제 Postgres, `bootstrap-http`는 API 테스트, 프론트는 순수 로직과 컴포넌트 테스트(E2E 제외). 상세는 [docs/trd/04-layer-boundaries.md](../../docs/trd/04-layer-boundaries.md)와 [docs/tech_stack.md](../../docs/tech_stack.md)를 따른다.
- 테스트를 통과시키려고 테스트를 약화하거나 삭제하지 않는다.

근거: 이 프로젝트의 목적이 학습이며, 테스트가 설계를 이끄는 경험이 핵심이다.

### IV. 핵심 불변식을 지킨다 (Domain Invariants)

- 티켓의 공개 식별자 `ticketId`(UUID v4)는 DB 내부 PK와 별개다. 내부 PK는 API와 도메인에 노출하지 않는다.
- 카드 이동은 클라이언트가 계산한 순서 값이 아니라 "기준 카드의 앞/뒤"로 요청한다. 순서 키는 서버의 `Position` 값 객체가 계산한다.
- 위 규칙을 바꾸려면 코드가 아니라 `docs/`와 `decision_log.md`를 먼저 개정한다 (원칙 I, 거버넌스).

근거: 나중에 바꾸기 비싼 결정이며, 보안(식별자 추측 방지)과 동시성(순서 충돌)에 직결된다.

### V. 단순함과 범위 절제 (Simplicity & Scope)

- MVP 범위(P0)만 구현한다. PRD의 2차 제외 범위는 구현하지 않는다.
- 필요가 확인되기 전에는 추상화·옵션·확장 포인트를 만들지 않는다 (YAGNI).
- 복잡도를 늘리는 선택은 plan의 "복잡도 추적"에 정당화를 남긴다.

근거: 학습용 1인 프로젝트에서 범위 확산은 완성을 막는다.

### VI. 타입 안전과 API 계약 준수 (Type Safety & Contract)

- 모든 패키지는 TypeScript `strict` 모드로 컴파일한다. `strict`를 끄거나 패키지별로 완화하지 않는다.
- `any` 타입을 쓰지 않는다. 타입을 알 수 없는 값은 `unknown`으로 받아 좁힌다. ESLint(`@typescript-eslint/no-explicit-any`)로 강제하고, 예외는 사유를 주석으로 남긴 줄 단위 비활성화만 허용한다.
- `@ts-ignore`·`@ts-nocheck`·근거 없는 타입 단언(`as`)으로 검사를 우회하지 않는다.
- API 요청·응답과 오류 형식은 [docs/api_spec.md](../../docs/api_spec.md)를 따른다. 필드 이름·상태 코드·오류 코드·오류 응답 형식을 임의로 바꾸지 않고, 계약이 바뀌면 문서를 먼저 개정한다 (원칙 I).
- 계약 테스트는 명세의 상태 코드와 응답 형태를 직접 검증한다.

근거: 컴파일 단계에서 오류를 잡고, 프론트와 백엔드가 같은 계약을 공유해야 `api-client` 생성 타입이 의미를 갖는다.

### VII. 필수 가드레일 (Guardrails, NON-NEGOTIABLE)

- **품질 게이트**: 태스크 완료·커밋 전에 타입 검사, 린트, 테스트가 로컬에서 모두 통과해야 한다. 게이트를 끄거나 건너뛰지 않는다 (`--no-verify` 금지). CI가 도입되면 같은 검사를 CI에서도 돌린다.
- **비밀값**: 커밋 전에 스테이징된 diff를 확인해 비밀값이 없는지 본다. `.env`류는 `.gitignore`에 두고 저장소에는 값이 없는 `.env.example`만 둔다. ([제약 사항](#제약-사항)의 비밀값 규칙)
- **되돌리기 어려운 작업은 사용자 승인 후에만**: force push, `reset --hard`, 브랜치·파일 삭제, DB 삭제·초기화, 배포·원격 push. 요청받지 않은 커밋·push를 하지 않는다.
- **마이그레이션**: 이미 커밋된 마이그레이션 파일은 수정하지 않고 새 파일로 추가한다. 로컬·테스트 DB에서만 실행하며 배포(프로덕션) DB에는 로컬 작업으로 접근하지 않는다.
- **의존성**: [tech_stack.md](../../docs/tech_stack.md)의 확정 스택 밖 라이브러리는 추가 전에 사용자에게 확인한다. 새 의존성은 plan에 사유를 남긴다.
- **범위 고정**: tasks에 없는 기능·파일을 바꾸지 않는다. 계층 경계 위반, 명세와 문서의 충돌, 미결 항목을 만나면 구현을 멈추고 보고한다 (원칙 I, II).

근거: 공개 저장소와 AI 에이전트 협업에서 되돌리기 어려운 사고(비밀값 유출, 데이터 손실, 검사 우회)를 규칙으로 미리 막는다.

## 제약 사항

- 저장소가 공개(public)이므로 비밀값(DB 연결 문자열, 토큰 등)을 절대 커밋하지 않는다. 환경 변수와 배포 플랫폼의 시크릿을 쓴다.
- 문서 한 개는 200줄을 넘기지 않는다. 넘으면 하위 문서로 쪼갠다.
- 기술 스택은 [docs/tech_stack.md](../../docs/tech_stack.md)의 확정 항목을 따른다. 모노레포는 pnpm + Turborepo다.

## 개발 워크플로

- 기능 단위로 `specify → clarify → plan → tasks → analyze → implement` 순서로 진행한다. 산출물은 `specs/`에 둔다.
- plan은 시작 전에 이 헌법과 `docs/`를 점검하고(Constitution Check), 위반은 정당화 없이 통과시키지 않는다.
- 커밋은 Conventional Commits 관례를 따른다 (도구 강제 없음). 상세는 [docs/decision_log.md](../../docs/decision_log.md)의 D-62(커밋·PR 규칙)를 참조한다.
- 하나의 태스크는 테스트와 구현이 통과한 상태로 커밋한다.

## Governance

- 이 헌법은 spec, plan, tasks의 작성·검증 기준이며 다른 작업 관행보다 우선한다. `docs/`와 충돌하면 `docs/`가 정본이므로 헌법을 `docs/`에 맞춰 개정한다.
- 개정은 변경 이유를 `docs/decision_log.md`에 남기고 `docs/changelog.md`에 기록한 뒤 이 문서를 수정한다.
- 버전은 시맨틱 버전을 따른다. 원칙 삭제·재정의는 MAJOR, 원칙·섹션 추가나 실질적 확장은 MINOR, 표현 정리는 PATCH다.
- `/speckit-plan`의 Constitution Check와 `/speckit-analyze`에서 준수 여부를 검증한다. 헌법 위반은 CRITICAL로 취급한다.

**Version**: 1.2.0 | **Ratified**: 2026-09-21 | **Last Amended**: 2026-09-21
