# Feature Specification: 티켓 부분 수정

**Feature Branch**: `development` (디렉터리 이름만 `003-ticket-update`)

**Created**: 2026-09-21

**Status**: 구현 완료 (2026-09-21, TC-API-038~051 통과)

**Input**: 사용자 요청 "목록 조회·수정·삭제, 카드 이동, 프론트엔드 작업들 쭉 진행하자" 중 수정 (백엔드)

> 정본은 `docs/`다. 참조: [FR-01·FR-05·FR-06](../../docs/functional_requirements.md), [API 명세](../../docs/api_spec.md)(생성과 수정·`PATCH` 예외), [테스트 케이스](../../docs/test_cases.md). 001·002의 계층·오류 규칙을 그대로 따른다.

## 범위

**포함**: `PATCH /v1/tickets/{ticketId}`로 제목·설명·우선순위·마감일 부분 수정.

**제외**: 태그 수정(태그 기능), 상태·순서 변경(카드 이동 기능, `PATCH`로는 영구히 불가), 프론트엔드.

## 결정 (D-94)

- **부분 수정 의미**: 본문에 없는 필드는 그대로 둔다. `description`과 `dueAt`은 `null`(설명은 빈 문자열·공백뿐도)로 **비울 수 있다**. `title`·`priority`는 `null`로 비울 수 없다(`400`).
- 수정할 필드가 하나도 없는 본문(`{}`, 미지 필드만)은 `400 VALIDATION_FAILED`다(api_spec).
- 서버가 정하는 값(`ticketId`, `status`, `position`, `createdAt`, `updatedAt`)과 `tags`(임시)는 무시하지 않고 `400`으로 거부한다(생성과 같은 규칙, D-92).
- 수정하면 `updatedAt`이 갱신되고 `createdAt`·`status`·`position`은 바뀌지 않는다.
- 도메인 `Ticket.update()`가 값 객체로 검증하고 새 `Ticket`을 돌려준다(불변). 저장소 포트에 `update(ticket)`을 추가한다(없으면 `null`).

## User Scenarios & Testing

### User Story 1 - 티켓 내용 고치기 (P1)

1. **Given** 존재하는 티켓, **When** 제목만 보내면, **Then** `200`과 수정된 티켓이 돌아오고 다른 필드는 그대로다.
2. **Given** 여러 필드를 보내면, **Then** 모두 반영된다.
3. **Given** `description`을 `null`·`""`·공백뿐으로 보내면, **Then** 설명이 `null`이 된다. `dueAt: null`이면 마감일이 지워진다.
4. **Given** 수정 후, **Then** `updatedAt`이 갱신되고 `createdAt`·상태·컬럼 안 순서는 그대로다.

### User Story 2 - 잘못된 수정 거부 (P2)

1. 빈 본문·미지 필드만 → `400`. 서버 지정 값·`tags` → `400`(모두 `details`).
2. 제목 빈 값·`null`·101자, 설명 2001자, 우선순위 허용 값 밖·`null`, `dueAt` 형식 오류 → `400 VALIDATION_FAILED`.
3. 없는 티켓 `404 TICKET_NOT_FOUND`, UUID 형식 아님 `400 INVALID_TICKET_ID`, 올바르지 않은 JSON `400 INVALID_REQUEST_BODY`, JSON 아닌 `Content-Type` `415`.
4. 실패한 수정은 저장된 값을 바꾸지 않는다.

## Functional Requirements

- **FR-001**: 위 의미로 부분 수정하고 수정된 티켓을 `200`으로 돌려준다.
- **FR-002**: 검증 규칙은 생성과 같다(제목 100자·설명 2000자·우선순위 enum·ISO 8601).
- **FR-003**: TDD로 진행한다(TC 정의 → RED → GREEN).
