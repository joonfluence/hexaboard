# 테스트 케이스 03. API·기동 (bootstrap-http)

실제 Nest 앱과 Testcontainers Postgres 위에서 HTTP로 검증한다. 규칙은 [test_cases.md](../test_cases.md)를, 요청별 기대 응답의 정본은 [api_spec.md](../api_spec.md)를 본다. 계약 케이스 ID(C·V·G)는 기능 명세 [contracts](../../specs/001-ticket-create-get/contracts/tickets-api.md)의 것이다. ⏳ 케이스는 RED 테스트를 쓸 때 테스트 이름에 TC ID를 넣는다.

## 설정·기동 — `apps/bootstrap-http/test/config.spec.ts`, `startup.int-spec.ts`, `smoke.api-spec.ts`

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-RUN-001 | 환경변수로 DB 접속 정보 읽기 | 포트는 숫자로 변환 | NFR-03 | ✅ |
| TC-RUN-002 | 필수 변수 하나가 없음(5종) | 빠진 변수 이름을 알려 주며 실패 | NFR-03 | ✅ |
| TC-RUN-003 | 값이 빈 문자열 | 없는 것으로 봄(`.env.example` 상태) | NFR-03 | ✅ |
| TC-RUN-004 | 숫자가 아닌 포트 | 거부 | NFR-03 | ✅ |
| TC-RUN-005 | 서버 포트 읽기 | 숫자 | NFR-03 | ✅ |
| TC-RUN-006 | 서버 기동 | 마이그레이션이 적용되어 `ticket` 테이블 생성 | D-72 | ✅ |
| TC-RUN-007 | 마이그레이션 실패 | 기동 중단 | D-72 | ✅ |
| TC-RUN-008 | `/v1` 아래 없는 경로 | 프레임워크 기본 `404` | api_spec | ✅ |
| TC-RUN-009 | 접두사 없는 경로 | `404` | D-66 | ✅ |

## 티켓 생성 — `POST /v1/tickets` (US1)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-001 | C1: 제목만 | `201`, `TODO`, `MEDIUM`, 새 `ticketId` | FR-01, FR-02, FR-06 | ✅ |
| TC-API-002 | C1: 응답 필드 | `id`·`position`·`tags` 없음, 정해진 8개 필드만 | D-80, 헌법 IV | ✅ |
| TC-API-003 | C2: 모든 값 | 그대로 저장 | FR-01 | ✅ |
| TC-API-004 | C3: 제목 앞뒤 공백 | 제거해 저장 | D-81 | ✅ |
| TC-API-005 | C4: 설명 `""`·공백뿐(2종) | `null`로 저장 | D-81 | ✅ |
| TC-API-006 | C5: 제목 100자·설명 2000자 | `201` | D-51 | ✅ |
| TC-API-007 | C6: 같은 내용 두 번 | 서로 다른 `ticketId` 두 건 | FR-01 | ✅ |
| TC-API-008 | C7: 이름이 다른 미지 필드 | 무시하고 `201` | D-81 | ✅ |
| TC-API-009 | 여러 건 생성 | `TODO` 컬럼 맨 뒤에 생성 순으로 놓임 | D-79 | ✅ |
| TC-API-010 | 세 번째 생성 | 기존 카드의 순서 키 불변 | D-79 | ✅ |
| TC-API-011 | V9: 재시도 후에도 충돌 | 4번 시도 후 `409` `POSITION_CONFLICT` | D-84 | ✅ |
| TC-API-012 | 1·2·3번 충돌 뒤 성공(3종) | `201` | D-84 | ✅ |
| TC-API-013 | 충돌 재시도 | 시도마다 마지막 순서 키를 다시 읽음 | D-84 | ✅ |

## 티켓 조회 — `GET /v1/tickets/{ticketId}` (US2)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-014 | G1: 존재하는 `ticketId` | `200`, 생성 시 값과 일치 | FR-01 | ⏳ |
| TC-API-015 | G1: 응답 필드 | 내부 PK·`position` 없음 | D-80 | ⏳ |
| TC-API-016 | G2: UUID 형식이나 없는 티켓 | `404` `TICKET_NOT_FOUND` | api_spec | ⏳ |
| TC-API-017 | G3: UUID가 아닌 값 | `400` `INVALID_TICKET_ID` | api_spec | ⏳ |

## 생성 요청 검증 — `POST /v1/tickets` (US3)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-018 | V1: 제목 없음·`null`·`""`·공백뿐 | `400` `VALIDATION_FAILED`, `details`에 `title` | FR-01 | ⏳ |
| TC-API-019 | V2: 제목 101자·설명 2001자 | `400` `VALIDATION_FAILED` | D-51 | ⏳ |
| TC-API-020 | V3: 우선순위 허용 값 밖·`null` | `400` `VALIDATION_FAILED` | FR-06 | ⏳ |
| TC-API-021 | V4: `dueAt`이 ISO 8601이 아님 | `400` `VALIDATION_FAILED` | api_spec | ⏳ |
| TC-API-022 | V5: `ticketId`·`status`·`position`·`createdAt`·`updatedAt` 포함 | `400`으로 거부(무시하지 않음) | D-51 | ⏳ |
| TC-API-023 | V6: `tags` 포함 | `400`(이 기능 한정 임시 규칙, 태그 기능에서 폐기) | 기능 명세 FR-006 | ⏳ |
| TC-API-024 | V7: 올바르지 않은 JSON | `400` `INVALID_REQUEST_BODY` | api_spec | ⏳ |
| TC-API-025 | V8: JSON이 아닌 `Content-Type` | `415` `UNSUPPORTED_MEDIA_TYPE`(프레임워크 동작 확인 필요) | api_spec | ⏳ |
| TC-API-026 | 검증 실패 응답 형식 | `statusCode`·`code`·`message`, 필드별 `details` | api_spec | ⏳ |
| TC-API-027 | 모든 검증 실패 뒤 | 저장된 티켓 0건 | 기능 명세 SC-002 | ⏳ |
