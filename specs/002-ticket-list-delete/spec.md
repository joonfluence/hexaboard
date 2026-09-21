# Feature Specification: 티켓 목록 조회와 삭제

**Feature Branch**: `development` (디렉터리 이름만 `002-ticket-list-delete`)

**Created**: 2026-09-21

**Status**: 구현 완료 (2026-09-21, TC-API-028~037 통과)

**Input**: 사용자 요청 "목록 조회·수정·삭제, 카드 이동, 프론트엔드 작업들 쭉 진행하자" 중 목록 조회와 삭제 (백엔드)

> 정본은 `docs/`다. 참조: [FR-01·FR-03](../../docs/functional_requirements.md), [US-02](../../docs/user_stories.md), [API 명세](../../docs/api_spec.md), [테스트 케이스](../../docs/test_cases.md). 001의 계층·오류 규칙을 그대로 따른다([001 spec](../001-ticket-create-get/spec.md)).

## 범위

**포함**: `GET /v1/tickets`(전체 목록), `DELETE /v1/tickets/{ticketId}`.

**제외**: 검색·필터(`q`, `priority`, `tag`, FR-08), 태그, 수정, 이동, 정렬, 프론트엔드. 이후 기능에서 다룬다. 쿼리 파라미터는 이번에 해석하지 않고 무시한다.

## 결정 (사용자 확인 없이 진행, 근거는 decision_log D-93)

- 목록 응답은 **JSON 배열**이다(페이지네이션·봉투 없음, api_spec "페이지네이션 없이 모두"). 정렬은 상태 순서(`TODO`, `IN_PROGRESS`, `DONE`) 다음 컬럼 안 `position` 오름차순이다. 프론트는 `status`로 컬럼을 나눈다.
- 삭제는 **행 삭제**(soft delete 없음)이며 성공 시 `204` 본문 없음. 이미 삭제된 티켓은 `404`(api_spec).
- 응답의 티켓 표현은 001과 같다(내부 PK·`position` 없음).

## User Scenarios & Testing

### User Story 1 - 전체 티켓 목록 보기 (P1)

개발자(본인)가 보드에 그릴 티켓을 한 번에 받는다.

**Acceptance Scenarios**:

1. **Given** 티켓이 없을 때, **When** 목록을 조회하면, **Then** `200`과 빈 배열이다.
2. **Given** 여러 티켓, **When** 조회하면, **Then** 모두 담기고 각 티켓은 단건 조회 표현과 같다.
3. **Given** 세 상태에 티켓이 섞여 있고 생성 순서가 뒤섞여도, **When** 조회하면, **Then** `TODO`→`IN_PROGRESS`→`DONE` 순이며 같은 상태 안에서는 컬럼 순서(생성 순)다.
4. **Given** 어떤 응답이든, **Then** 내부 PK와 `position`은 없다.

### User Story 2 - 티켓 삭제 (P1)

**Acceptance Scenarios**:

1. **Given** 존재하는 티켓, **When** 삭제하면, **Then** `204`이고 이후 단건 조회는 `404`, 목록에서 사라진다.
2. **Given** 같은 컬럼의 다른 티켓, **When** 하나를 삭제해도, **Then** 나머지 티켓과 순서는 그대로다.
3. **Given** 없는 티켓(형식은 UUID) 또는 이미 삭제된 티켓, **When** 삭제하면, **Then** `404` `TICKET_NOT_FOUND`.
4. **Given** UUID 형식이 아닌 값, **When** 삭제하면, **Then** `400` `INVALID_TICKET_ID`.
5. **Given** 삭제 후, **When** 새 티켓을 만들면, **Then** `TODO` 맨 뒤에 정상 생성된다(순서 키 유지).

## Functional Requirements

- **FR-001**: 목록은 페이지네이션 없이 모든 티켓을 상태 순서, 컬럼 안 순서로 돌려준다.
- **FR-002**: 삭제는 `ticketId`로 한 건을 지우고 `204`를 돌려준다. 없으면 `404`.
- **FR-003**: TDD로 진행한다(헌법 III). TC 정의 → RED → GREEN 커밋.
- **FR-004**: 계층 규칙: 유스케이스는 `application`, 저장소 포트에 `findAll`·`deleteByTicketId` 추가, 어댑터는 `persistence`.
