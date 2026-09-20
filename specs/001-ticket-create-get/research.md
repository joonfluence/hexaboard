# Research: 티켓 생성과 단건 조회

이 문서는 plan의 "구현 시 확정" 항목을 어떻게, 언제 확정할지 정한다. 기술 선택 자체는 `docs/`에서 이미 확정되었으므로 다시 조사하지 않는다 ([tech_stack](../../docs/tech_stack.md), [decision_log](../../docs/decision_log.md)). 값을 미리 지어내지 않고 확인 방법만 적는다.

## 이미 확정된 것 (재논의하지 않음)

- 언어·프레임워크·ORM·DB·테스트 도구·모노레포 도구: [tech_stack.md](../../docs/tech_stack.md)
- 계층 경계와 테스트 범위: [TRD 04](../../docs/trd/04-layer-boundaries.md)
- 오류 코드와 응답 형식: [api_spec.md](../../docs/api_spec.md)
- 새 티켓은 `TODO` 컬럼 맨 뒤(D-79), 응답에 `position` 미노출(D-80), 제목·설명 정규화와 미지 필드 무시(D-81), TS strict·`any` 금지(D-82), 가드레일(D-83)

## 구현 시 확정할 항목

| 항목 | 확정 시점 | 확인 방법 | 결정 기록 |
|------|-----------|-----------|-----------|
| Node 정확한 버전 | Phase A 첫 태스크 | nodejs.org 공식 릴리스 페이지에서 당시 LTS 확인 | TRD 05·open_questions 갱신, decision_log |
| 패키지 버전 (Nest, MikroORM, Jest, Testcontainers, ESLint 등) | 각 패키지 도입 시 | 각 공식 문서·릴리스 노트. 확정 스택 밖 패키지는 사용자 확인 | 필요 시 decision_log |
| Jest에서 데코레이터 메타데이터 동작 | Phase A·C | 공식 문서로 Nest·MikroORM과의 호환 확인. TRD 02가 "버전에 따라 다를 수 있어 확인"으로 남김 | 문제 발생 시에만 |
| UUID v4 생성 방법 | Phase B | Node 내장 기능 또는 라이브러리를 공식 문서로 확인. `domain`은 프레임워크를 몰라야 한다 | 라이브러리 추가 시 사용자 확인 |
| 우선순위 숫자 매핑 | Phase C 매퍼 | 순서를 나타내는 숫자(`LOW`<…<`URGENT`)이면 되고 정확한 값은 매퍼 테스트로 고정 | data_model 갱신 |
| ESLint 설정 형식과 `no-explicit-any` 규칙 이름 | Phase A | 설치한 ESLint·typescript-eslint 공식 문서 | TRD 05 갱신 |
| 계층 역방향 import 검사 방식 | Phase A | 패키지 `dependencies`로 설치 단계에서 막히는지 + ESLint 규칙 보조 여부 확인 | TRD 04 갱신 |
| 요청·응답 스키마 상세 | Phase E | Nest DTO에서 OpenAPI가 생성하는 스키마를 확인 | open_questions 갱신 |
| `Content-Type`이 JSON이 아닐 때 프레임워크 동작 | Phase E | Nest 기본 동작을 API 테스트로 확인해 `415`와 `UNSUPPORTED_MEDIA_TYPE`이 되는지 확인 | api_spec 갱신 |
| 순서 키 길이 상한 | 카드 이동 기능 | 이번 범위에서는 "마지막 키 뒤"만 만들므로 결정 불필요 | open_questions 유지 |

## Decision: 생성 시 순서 키 충돌

- **Decision (제안, 사용자 확인 필요)**: 생성에도 동시 이동과 같은 재시도 상수(최초 시도 후 최대 3회)를 재사용하고, 초과하면 `409 POSITION_CONFLICT`.
- **Rationale**: (상태, 순서 키) 유니크 제약 때문에 동시 생성이 같은 키를 만들 수 있고, 이미 정한 충돌 처리(D-69)와 응답 코드를 재사용하면 새 규칙이 없다.
- **Alternatives considered**: (a) 충돌 시 즉시 `409` — 재시도 정책과 어긋나 일관성이 떨어짐. (b) 순서 키 유니크 제약 완화 — 동시 충돌을 (상태, 순서 키) 유니크 제약으로 막기로 한 확정 결정(changelog v0.44)을 뒤집음.

## Decision: 스크립트 이름

- **Decision (제안)**: Turborepo 태스크 `typecheck`, `lint`, `test`, `build`, `dev`.
- **Rationale**: 관례적인 이름이라 학습 비용이 없고 CI에서도 그대로 쓴다.
- **Alternatives considered**: `check`로 묶기 — 실패 원인을 분리해서 보기 어려움.
