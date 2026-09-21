# TDD 기록: 티켓 부분 수정

## RED (2026-09-21)

- 도메인: `Ticket.update` 없음으로 TC-DOM-039~046 14건 실패(기존 60건 통과).
- persistence: `update` 없음으로 TC-PER-027~029 3건 실패(기존 29건 통과).
- API: `tickets.update*` 24건 중 23건 실패(PATCH 라우트 없음). TC-API-051(검증 실패한 수정은 값을 바꾸지 않는다)은 라우트가 없어도 값이 안 바뀌므로 RED에서 통과했다. 이 테스트는 이후 회귀를 막는 역할이며 다른 TC가 동작을 검증한다.

## GREEN

- 도메인 `Ticket.update`(불변, 값 객체로 검증), 포트 `update`, `MikroOrmTicketRepository.update`(내용 필드만 덮어씀, `updatedAt`은 ORM 훅), `UpdateTicket` 유스케이스, `UpdateTicketDto`, 컨트롤러 `PATCH`.
- 빈 본문 검사는 컨트롤러가 DTO 검증 뒤에 한다(허용 필드가 모두 생략이면 `400`).
- 001·002의 저장소 대역에 `update`를 추가했다.

## 게이트 (2026-09-21)

- domain 74, persistence 32, bootstrap-http 97(설정·기동 13 + API 84) 통과. typecheck·lint·build·prettier 통과.
- 환경: API 스위트가 14개로 늘어 jest 기본 워커(9)가 Postgres 컨테이너를 동시에 띄우다 hook 타임아웃(120s)이 발생(코드 결함 아님). `apps/bootstrap-http/jest.config.cjs`에 `maxWorkers: 3`을 추가해 해결(전체 약 3분 30초).
