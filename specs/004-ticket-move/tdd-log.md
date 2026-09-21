# TDD 기록: 카드 이동

## RED (2026-09-21)

- 도메인: `Position.between`·`Ticket.moveTo` 없음과 확장 형식 검증으로 TC-DOM-047~056 19건 실패(기존 74건 통과).
- persistence: 포트 메서드 없음으로 TC-PER-030~034 5건 실패(기존 32건 통과).
- API: `tickets.move*` 27건 중 25건 실패(PUT 라우트 없음). 나머지 2건은 라우트가 없어도 성립하는 부정 검증이라 RED에서 통과했고 이후 회귀를 막는다.

## GREEN

- 도메인: `Position`을 fractional indexing으로 재작성(`between`, 음수 머리 `A`~`Z`, 소수부 규칙, 예약 키), `Placement` 상수, `Ticket.moveTo`. 기존 `first`/`after`/`from` 동작은 기존 테스트로 유지 확인.
- persistence: `findAdjacentPosition`, `hasTicketsInStatus`, `move`(상태·순서 키만 갱신). 유니크 위반 변환을 `flushOrConflict`로 공용화.
- application: `MoveTicket`(시도마다 재조회, 최대 3회 재시도), 오류 `AnchorTicketNotFoundError`·`InvalidPositionTargetError`.
- 웹: `MovePositionDto`, 컨트롤러 `PUT :ticketId/position`, 예외 필터 매핑 2종.

## 게이트 (2026-09-21)

- domain 93, persistence 37, bootstrap-http 124(설정·기동 13 + API 111) 통과. typecheck·lint·build·prettier 통과.
- 테스트 결함 1건: TC-PER-031이 uuid 컬럼에 `'x-none'`을 넣어 실패 → 유효한 UUID로 수정(구현 결함 아님).
