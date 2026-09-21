# Feature Specification: 카드 이동

**Feature Branch**: `development` (디렉터리 이름만 `004-ticket-move`)

**Created**: 2026-09-21

**Status**: 구현 완료 (2026-09-21, TC-API-052~070 통과)

**Input**: 사용자 요청 "목록 조회·수정·삭제, 카드 이동, 프론트엔드 작업들 쭉 진행하자" 중 카드 이동 (백엔드)

> 정본은 `docs/`다. 참조: [FR-02·FR-04](../../docs/functional_requirements.md), [API 명세 — 카드 이동](../../docs/api_spec.md), [데이터 모델 — position](../../docs/data_model.md), [테스트 케이스](../../docs/test_cases.md). 001~003의 계층·오류 규칙을 그대로 따른다.

## 범위

**포함**: `PUT /v1/tickets/{ticketId}/position`(상태 변경 + 컬럼 안 순서), 도메인 `Position.between`(두 키 사이·맨 앞 키), 저장소 이웃 조회·이동.

**제외**: 정렬(`POST /tickets/sort`), 필터, 태그, 프론트엔드.

## 결정 (D-95)

- **순서 키 알고리즘**: fractional indexing(머리 문자 + 정수부 + 소수부, base62) 방식을 라이브러리 없이 직접 구현한다(data_model). 기존 `a0`, `a1`… 키와 호환되며, 맨 앞 삽입을 위해 머리 문자 `A`~`Z`(음수 정수부)를 허용한다. 가장 작은 키는 예약해 사용하지 않는다.
- **키 길이 상한**: 두지 않는다(`position`은 길이 미지정 `text`). 같은 자리에 삽입을 반복하면 키가 길어질 수 있으나 정렬 기능이 키를 다시 써서 짧게 만든다. 상한 초과가 실제로 문제가 되면 그때 정한다(open_questions에서 해소).
- **이동 규칙**(api_spec 그대로 + 세부 확정): 이동할 카드 자신은 대상 컬럼의 이웃 계산에서 제외한다. 대상 컬럼에 이동할 카드 말고 다른 카드가 없으면 기준 카드는 생략해야 하고(생략 시 첫 키), 있으면 기준 카드가 필수다. 이동 결과는 항상 `BEFORE`/`AFTER` 기준 카드의 바로 앞/뒤 이웃과의 사이 키다. 같은 요청을 반복해도 카드 순서는 같다(멱등).
- **충돌 재시도**: 순서 키 충돌 시 이동할 카드·기준 카드·이웃을 모두 다시 읽어 재계산하고 최초 시도 후 최대 3회 재시도한다(D-69). 재시도 중 기준 카드가 사라지거나 대상 컬럼을 벗어나면 `409`로 본다. 계속 실패하면 `409 POSITION_CONFLICT`.
- 응답은 이동된 티켓(`200`, 001과 같은 표현, `position` 미노출).

## User Scenarios & Testing

### User Story 1 - 카드 옮기기 (P1)

1. **Given** 다른 컬럼, **When** 빈 컬럼으로 옮기면(기준 생략), **Then** 상태가 바뀌고 그 컬럼의 첫 카드가 된다.
2. **Given** 같은 컬럼, **When** 기준 카드의 앞(`BEFORE`)·뒤(`AFTER`)로 옮기면, **Then** 그 자리로 이동하고 다른 카드의 순서는 그대로다.
3. **Given** 카드가 있는 다른 컬럼, **When** 기준 카드의 앞/뒤로 옮기면, **Then** 상태가 바뀌고 컬럼 안 그 자리에 놓인다.
4. **Given** 컬럼 맨 앞으로 반복 이동해도, **Then** 순서가 항상 올바르다. 두 카드 사이에 반복 삽입해도 마찬가지다.
5. **Given** 이동 뒤 새 티켓을 만들면, **Then** `TODO` 맨 뒤에 놓인다(D-79).
6. **Given** 같은 이동 요청을 두 번, **Then** 결과 순서가 같다.

### User Story 2 - 잘못된 이동 거부 (P2)

- 본문 검증 실패(`status`·`placement` 누락·허용 값 밖, `anchorTicketId` UUID 아님) → `400 VALIDATION_FAILED`.
- 카드가 있는 대상 컬럼에 기준 생략, 기준이 자기 자신, 기준이 대상 컬럼에 없음 → `400 INVALID_POSITION_TARGET`.
- 이동할 카드 없음 `404 TICKET_NOT_FOUND`, UUID 아님 `400 INVALID_TICKET_ID`, 기준 카드 없음 `404 ANCHOR_TICKET_NOT_FOUND`.
- 순서 충돌: 재시도 안에 해소되면 `200`, 계속되면 `409 POSITION_CONFLICT`.
- 잘못된 JSON `400 INVALID_REQUEST_BODY`, JSON 아닌 `Content-Type` `415`.

## Functional Requirements

- **FR-001**: 위 규칙으로 상태와 컬럼 안 순서를 한 번에 바꾸고 카드 한 건의 행만 갱신한다.
- **FR-002**: 클라이언트는 순서 값을 보내지 않는다. 서버의 `Position` 값 객체가 계산한다.
- **FR-003**: TDD로 진행한다(TC 정의 → RED → GREEN).
