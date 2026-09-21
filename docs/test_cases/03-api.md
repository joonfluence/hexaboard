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
| TC-RUN-010 | `CORS_ALLOWED_ORIGINS` 읽기(쉼표 구분, 공백 제거, 비어 있으면 빈 목록) | 오리진 배열 | api_spec CORS, D-97 | ✅ |
| TC-RUN-011 | 허용한 오리진의 사전 요청(`OPTIONS`) | `Access-Control-Allow-Origin`이 그 오리진이고 `PUT`·`PATCH`·`DELETE` 허용 | api_spec CORS | ✅ |
| TC-RUN-012 | 허용하지 않은 오리진, 허용 목록이 빈 경우 | `Access-Control-Allow-Origin` 헤더 없음 | api_spec CORS | ✅ |

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
| TC-API-014 | G1: 존재하는 `ticketId` | `200`, 생성 시 값과 일치 | FR-01 | ✅ |
| TC-API-015 | G1: 응답 필드 | 내부 PK·`position` 없음 | D-80 | ✅ |
| TC-API-016 | G2: UUID 형식이나 없는 티켓 | `404` `TICKET_NOT_FOUND` | api_spec | ✅ |
| TC-API-017 | G3: UUID가 아닌 값 | `400` `INVALID_TICKET_ID` | api_spec | ✅ |

## 생성 요청 검증 — `POST /v1/tickets` (US3)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-018 | V1: 제목 없음·`null`·`""`·공백뿐 | `400` `VALIDATION_FAILED`, `details`에 `title` | FR-01 | ✅ |
| TC-API-019 | V2: 제목 101자·설명 2001자 | `400` `VALIDATION_FAILED` | D-51 | ✅ |
| TC-API-020 | V3: 우선순위 허용 값 밖·`null` | `400` `VALIDATION_FAILED` | FR-06 | ✅ |
| TC-API-021 | V4: `dueAt`이 ISO 8601이 아님 | `400` `VALIDATION_FAILED` | api_spec | ✅ |
| TC-API-022 | V5: `ticketId`·`status`·`position`·`createdAt`·`updatedAt` 포함 | `400`으로 거부(무시하지 않음) | D-51 | ✅ |
| TC-API-023 | V6: `tags` 포함 | 폐기: 태그 기능(007)이 대체(TC-API-083~089) | 기능 명세 FR-006 | ⛔ |
| TC-API-024 | V7: 올바르지 않은 JSON | `400` `INVALID_REQUEST_BODY` | api_spec | ✅ |
| TC-API-025 | V8: JSON이 아닌 `Content-Type` | `415` `UNSUPPORTED_MEDIA_TYPE`(프레임워크 기본은 `500`이라 가드로 구현) | api_spec | ✅ |
| TC-API-026 | 검증 실패 응답 형식 | `statusCode`·`code`·`message`, 필드별 `details` | api_spec | ✅ |
| TC-API-027 | 모든 검증 실패 뒤 | 저장된 티켓 0건 | 기능 명세 SC-002 | ✅ |

## 티켓 목록 조회 — `GET /v1/tickets` (002 US1)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-028 | 티켓 없음 | `200`, 빈 배열 | api_spec | ✅ |
| TC-API-029 | 여러 건 | `200`, 모두 포함하고 각 항목은 단건 조회 표현과 같음 | FR-01 | ✅ |
| TC-API-030 | 상태가 섞인 티켓 | 상태 순서(`TODO`→`IN_PROGRESS`→`DONE`)이고 같은 상태는 컬럼 순서 | FR-03 | ✅ |
| TC-API-031 | 응답 필드 | 내부 PK·`position` 없음, 정해진 8개 필드만 | D-80 | ✅ |

## 티켓 삭제 — `DELETE /v1/tickets/{ticketId}` (002 US2)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-032 | 존재하는 티켓 삭제 | `204`, 본문 없음 | api_spec | ✅ |
| TC-API-033 | 삭제 뒤 단건 조회·목록 | 조회 `404`, 목록에서 사라짐 | FR-01 | ✅ |
| TC-API-034 | 같은 컬럼의 다른 티켓 | 남은 티켓과 순서 그대로 | 002 US2 | ✅ |
| TC-API-035 | 없는 티켓·이미 삭제된 티켓 | `404` `TICKET_NOT_FOUND` | api_spec | ✅ |
| TC-API-036 | UUID 형식이 아님 | `400` `INVALID_TICKET_ID` | api_spec | ✅ |
| TC-API-037 | 삭제 뒤 새 티켓 생성 | `201`, `TODO` 맨 뒤 | D-79 | ✅ |

## 티켓 수정 — `PATCH /v1/tickets/{ticketId}` (003)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-038 | 제목만 수정 | `200`, 제목 반영·나머지 그대로, 단건 조회와 일치 | FR-01 | ✅ |
| TC-API-039 | 여러 필드 수정 | 모두 반영 | FR-01 | ✅ |
| TC-API-040 | `description`이 `null`·`""`·공백뿐(3종) | `null`로 저장 | D-94 | ✅ |
| TC-API-041 | `dueAt: null` | 마감일 해제 | D-94 | ✅ |
| TC-API-042 | 수정 응답 | 정해진 8개 필드, `createdAt` 불변, `updatedAt` 갱신 | D-80, D-50 | ✅ |
| TC-API-043 | 수정 후 목록 | 상태와 컬럼 안 순서 불변 | api_spec | ✅ |
| TC-API-044 | 빈 본문 `{}`·미지 필드만(2종) | `400` `VALIDATION_FAILED` | api_spec | ✅ |
| TC-API-045 | 서버 지정 값 5종(`status` 포함) | `400`으로 거부, 여러 개면 모두 `details` | api_spec, D-92 | ✅ |
| TC-API-046 | `tags` 포함 | 폐기: 태그 기능(007)이 대체(TC-API-086~089) | 003 | ⛔ |
| TC-API-047 | 제목 빈 값·`null`·101자, 설명 2001자, 우선순위 허용 밖·`null`, `dueAt` 형식 오류(8종) | `400` `VALIDATION_FAILED` | api_spec | ✅ |
| TC-API-048 | 없는 티켓 | `404` `TICKET_NOT_FOUND` | api_spec | ✅ |
| TC-API-049 | UUID 형식이 아님 | `400` `INVALID_TICKET_ID` | api_spec | ✅ |
| TC-API-050 | 올바르지 않은 JSON·JSON 아닌 `Content-Type` | `400` `INVALID_REQUEST_BODY`·`415` | api_spec | ✅ |
| TC-API-051 | 검증에 실패한 수정 뒤 | 저장된 값 그대로 | 003 | ✅ |

## 카드 이동 — `PUT /v1/tickets/{ticketId}/position` (004)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-052 | 빈 컬럼으로 이동(기준 생략) | `200`, 상태 변경, 그 컬럼 첫 카드 | FR-04 | ✅ |
| TC-API-053 | 같은 컬럼에서 기준 카드 뒤(`AFTER`)로 | 순서 반영, 다른 카드 순서 그대로 | FR-04 | ✅ |
| TC-API-054 | 같은 컬럼에서 기준 카드 앞(`BEFORE`)으로 | 순서 반영 | FR-04 | ✅ |
| TC-API-055 | 카드가 있는 다른 컬럼의 기준 앞·뒤로 | 상태 변경, 컬럼 안 그 자리 | FR-04 | ✅ |
| TC-API-056 | 컬럼 맨 앞으로 5번 반복 | 매번 올바른 순서 | FR-04 | ✅ |
| TC-API-057 | 두 카드 사이에 반복 삽입 | 순서 유지 | FR-04 | ✅ |
| TC-API-058 | 응답 | 이동된 티켓, 8개 필드, `position` 없음, 단건 조회와 일치 | D-80 | ✅ |
| TC-API-059 | 이동 | 다른 티켓의 순서 키는 바뀌지 않음(한 행만 갱신) | data_model | ✅ |
| TC-API-060 | 컬럼의 유일한 카드를 같은 컬럼으로(기준 생략) | `200` | 004 | ✅ |
| TC-API-061 | 같은 요청 두 번 | 결과 순서 같음(멱등) | api_spec | ✅ |
| TC-API-062 | 이동 뒤 새 티켓 생성 | `TODO` 맨 뒤 | D-79 | ✅ |
| TC-API-063 | 본문 검증(`status`·`placement` 누락·허용 밖, `anchorTicketId` UUID 아님, 본문이 객체 아님 6종) | `400` `VALIDATION_FAILED` | api_spec | ✅ |
| TC-API-064 | 카드가 있는 컬럼에 기준 생략 | `400` `INVALID_POSITION_TARGET` | api_spec | ✅ |
| TC-API-065 | 기준이 자기 자신 | `400` `INVALID_POSITION_TARGET` | api_spec | ✅ |
| TC-API-066 | 기준이 대상 상태 컬럼에 없음 | `400` `INVALID_POSITION_TARGET` | api_spec | ✅ |
| TC-API-067 | 이동할 카드 없음·UUID 형식 아님 | `404` `TICKET_NOT_FOUND`·`400` `INVALID_TICKET_ID` | api_spec | ✅ |
| TC-API-068 | 기준 카드 없음 | `404` `ANCHOR_TICKET_NOT_FOUND` | api_spec | ✅ |
| TC-API-069 | 순서 충돌 | 1~3번 뒤 성공이면 `200`(시도마다 이웃 다시 읽음), 4번 실패면 `409` `POSITION_CONFLICT` | D-69, D-95 | ✅ |
| TC-API-070 | 올바르지 않은 JSON·JSON 아닌 `Content-Type` | `400` `INVALID_REQUEST_BODY`·`415` | api_spec | ✅ |

## OpenAPI 계약 — `apps/bootstrap-http/test/openapi.spec.ts` (005)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-071 | 생성한 OpenAPI 문서의 경로 | `/v1/tickets`(GET·POST), `/v1/tickets/{ticketId}`(GET·PATCH·DELETE), `/v1/tickets/{ticketId}/position`(PUT) | api_spec | ✅ |
| TC-API-072 | 티켓 응답 스키마 | 정해진 8개 필드만, 내부 PK(`id`)·`position` 없음 | D-80, 헌법 IV | ✅ |
| TC-API-073 | 이동 요청 스키마 | `status`·`anchorTicketId`·`placement`만 있고 `position` 없음 | FR-04, 헌법 IV | ✅ |
| TC-API-074 | 커밋된 `packages/api-client/openapi.json` | 서버 DTO에서 지금 생성한 문서와 같음(어긋남 감지) | TRD 03 | ✅ |


## 컬럼 정렬 — `POST /v1/tickets/sort` (006)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-075 | 우선순위 오름·내림 | `204`, 목록에 정렬 결과 반영 | FR-09 | ✅ |
| TC-API-076 | 마감일 오름·내림, 마감일 없는 카드 | 방향과 무관하게 없는 카드가 맨 뒤 | FR-09 | ✅ |
| TC-API-077 | 다른 컬럼 | 순서·상태 불변 | FR-09 | ✅ |
| TC-API-078 | 정렬 뒤 새 티켓 생성·이동 | `TODO` 맨 뒤 생성, 이동 정상 | D-79 | ✅ |
| TC-API-079 | 빈 컬럼 | `204` | D-98 | ✅ |
| TC-API-080 | `status`·`sortBy`·`direction` 누락·허용 밖(6종) | `400` `VALIDATION_FAILED` | api_spec | ✅ |
| TC-API-081 | 올바르지 않은 JSON·JSON 아닌 `Content-Type` | `400`·`415` | api_spec | ✅ |
| TC-API-082 | 정렬 뒤 내용 필드 | 제목 등 그대로 | FR-09 | ✅ |

## 태그 (007)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-083 | 생성 시 `tags` | `201`, 정규화·중복 제거·오름차순 | FR-07 | ✅ |
| TC-API-084 | 생성 시 `tags` 생략 | 응답 `tags`는 `[]` | D-99 | ✅ |
| TC-API-085 | 단건·목록 조회 | 각 티켓에 `tags` | FR-07 | ✅ |
| TC-API-086 | 수정 시 `tags` | 통째로 교체, `[]`는 모두 제거, 생략은 유지 | D-99 | ✅ |
| TC-API-087 | `tags`만 담은 수정 | `200`(수정할 필드로 인정) | D-99 | ✅ |
| TC-API-088 | 배열 아님·문자열 아닌 항목·빈 이름·31자·11개(5종), 생성·수정 모두 | `400` `VALIDATION_FAILED`, `details.field`=`tags` | api_spec | ✅ |
| TC-API-089 | `tags: null` | `400` | D-99 | ✅ |
| TC-API-090 | 응답 필드 | 정해진 9개 필드(`tags` 포함), 내부 PK·`position` 없음 | D-80 | ✅ |
| TC-API-091 | 이동·정렬·수정 뒤 | 태그 유지 | D-99 | ✅ |
| TC-API-092 | 삭제 뒤 같은 태그로 새 티켓 | `201` | D-99 | ✅ |

## 검색·필터 — `GET /v1/tickets?q=&status=&priority=&tag=` (008)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-API-093 | `q` | 제목·설명 부분 일치(대소문자 무시), 공백뿐·빈 `q`는 무시 | FR-08 | ⏳ |
| TC-API-094 | `priority`·`status` (단일·반복) | 해당 값의 티켓만, 반복하면 OR | FR-08 | ⏳ |
| TC-API-095 | `tag` 단일·반복·대문자 | 하나라도 가진 티켓(OR), 정규화해 비교 | FR-08, D-64 | ⏳ |
| TC-API-096 | 여러 종류 조합 | AND | D-64 | ⏳ |
| TC-API-097 | 조건에 맞는 티켓 없음 | `200` 빈 배열 | FR-08 | ⏳ |
| TC-API-098 | 허용 값 밖 `status`·`priority`(2종) | `400` `VALIDATION_FAILED`, `details.field`가 해당 파라미터 | api_spec | ⏳ |
| TC-API-099 | 필터 결과 | 상태 순서·컬럼 안 순서, 응답 필드는 목록과 같음 | api_spec | ⏳ |
| TC-API-100 | 정의되지 않은 쿼리 파라미터 | 무시 | D-81 | ⏳ |

