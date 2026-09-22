# 컴포넌트 명세 01. 보드와 카드

규칙은 [component_spec.md](../component_spec.md)를 본다. 테스트 케이스는 [04-ui.md](../test_cases/04-ui.md)에 있다.

## UI-C01 BoardView (`views/board`) ✅

- **책임**: 보드 화면을 조립한다. 상단 [FilterBar](03-board-controls.md)와 상태별 3개 컬럼을 배치한다.
- **데이터**: `GET /tickets`로 전체 목록을 받고 `status`로 컬럼을 나눈다. 필터 조건은 쿼리 파라미터로 보낸다.
- **확정**: 컬럼 3개 고정, 목록 전체 반환(페이지네이션 없음), 서버 순서를 그대로 쓴다. 로딩·오류(다시 시도 버튼)·빈 컬럼("카드 없음")을 표시한다 (D-96).
- **테스트**: TC-UI-001~003

## UI-C02 BoardColumn (`widgets/board-column`) ✅

- **책임**: 한 상태의 컬럼. 헤더(상태 이름, [정렬 메뉴](03-board-controls.md)), 카드 목록, 하단 인라인 생성 입력 자리를 가진다. 드래그의 놓기 대상이다.
- **입력**: 컬럼의 상태, 그 상태의 티켓 목록(서버 순서).
- **확정**: 정렬은 컬럼 단위이므로 정렬 메뉴는 컬럼 헤더에 둔다 (D-56). 빈 컬럼은 "카드 없음"을 표시하고, 인라인 생성 입력은 `TODO` 컬럼 하단에만 둔다 (D-96).
- **테스트**: TC-UI-001~003

## UI-C03 TicketCard (`entities/ticket`) ✅

- **책임**: 티켓 한 장을 보여준다. 제목과 우선순위·마감일·태그 배지를 표시하고, 클릭하면 [상세 모달](02-ticket-editing.md)을 연다 (D-56).
- **입력**: 티켓(`ticketId`, `title`, `priority`, `dueAt`, `tags`).
- **확정**: 우선순위는 항상 있으므로 우선순위 배지는 항상 표시한다. 마감일 배지는 마감일이 있을 때만, 태그 배지는 태그가 있을 때만 표시한다. 내부 PK는 없다(API가 노출하지 않음).
- **상호작용**: 클릭 → 상세 모달, 드래그 → [이동](03-board-controls.md).
- **테스트**: TC-UI-004~008

## UI-C04 PriorityBadge (`entities/ticket`) ✅

- **책임**: `LOW` / `MEDIUM` / `HIGH` / `URGENT` 네 단계를 구분해 표시한다 (FR-06).
- **확정**: 문구는 낮음/보통/높음/긴급이다 (D-96). 색은 제품 결정이 아니라 구현 세부라 코드([priority-badge.tsx](../../apps/web/src/entities/ticket/ui/priority-badge.tsx))가 정본이다.
- **테스트**: TC-UI-005

## UI-C05 DueDateBadge (`entities/ticket`) ✅

- **책임**: 마감일을 표시한다. 서버는 UTC로 주고 표시할 때 변환한다 (FR-05).
- **확정**: `M월 D일 HH:mm`(브라우저 시간대)로 표시하고, 지나면 "초과"로 강조한다. 임박 강조는 없다 (D-96).
- **테스트**: TC-UI-006

## UI-C06 TagBadge (`entities/ticket`) ✅

- **책임**: 태그 이름을 표시한다. 서버가 소문자로 정규화한 값을 그대로 보여준다 (FR-07).
- **테스트**: TC-UI-007
