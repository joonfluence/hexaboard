# Tasks: 티켓 목록 조회와 삭제

형식: 각 항목은 테스트(RED, 실패 확인) → 구현(GREEN) → 게이트(typecheck·lint·test·build·prettier) 통과 후 커밋. TC는 [docs/test_cases](../../docs/test_cases.md) 참조.

- [X] T001 TC 정의: TC-DOM-038, TC-PER-023~026, TC-API-028~037을 docs/test_cases에 ⏳로 추가
- [X] T002 RED: `TICKET_STATUSES` 도메인 상수 테스트 (`packages/domain/test/ticket.spec.ts`)
- [X] T003 GREEN: `packages/domain/src/ticket.ts`에 `TICKET_STATUSES` 추가
- [X] T004 RED: 저장소 `findAll`·`deleteByTicketId` 통합 테스트 (`packages/persistence/test/ticket.repository.int-spec.ts`)
- [X] T005 GREEN: 포트(`application`)와 `MikroOrmTicketRepository` 구현
- [X] T006 RED: API 테스트 `apps/bootstrap-http/test/tickets.list.api-spec.ts`, `tickets.delete.api-spec.ts`
- [X] T007 GREEN: `ListTickets`·`DeleteTicket` 유스케이스, 컨트롤러, `application` export
- [X] T008 문서: decision_log D-93, changelog, api_spec 미정 갱신, TC ✅, 이 spec Status 갱신, tdd-log
