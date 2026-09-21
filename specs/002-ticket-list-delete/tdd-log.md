# TDD 기록: 티켓 목록 조회와 삭제

## RED (2026-09-21)

- 도메인: `TICKET_STATUSES`가 없어 TC-DOM-038 실패(`undefined`). 나머지 59건 통과.
- persistence: `findAll`·`deleteByTicketId` 없음으로 TC-PER-023~026 4건 실패(25건 통과).
- API: `tickets.list`·`tickets.delete` 11건 전부 실패(엔드포인트 없음).
- 환경 메모: 셸 기본 Node가 22.22.1이라 `nvm use`(`.nvmrc` 24.21.0) 후 실행해야 ESM 오류가 나지 않는다.

## GREEN

- `TICKET_STATUSES` 도메인 상수, 포트에 `findAll`·`deleteByTicketId`, `ListTickets`·`DeleteTicket` 유스케이스, 컨트롤러 `GET /tickets`·`DELETE /tickets/:ticketId`(204).
- 상태 순서는 저장소가 순서 키 순으로 읽은 뒤 상태로 안정 정렬해 보장한다.
- 001의 저장소 대역(`tickets.create-conflict`)에 새 포트 메서드를 추가했다.
