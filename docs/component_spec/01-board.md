# 컴포넌트 명세 01. 보드와 카드

규칙은 [component_spec.md](../component_spec.md)를 본다. 테스트 케이스는 [04-ui.md](../test_cases/04-ui.md)에 있다.

## UI-C01 BoardView (`views/board`) ⏳

- **책임**: 보드 화면을 조립한다. 상단 [FilterBar](03-board-controls.md)와 상태별 3개 컬럼을 배치한다.
- **데이터**: `GET /tickets`로 전체 목록을 받고 `status`로 컬럼을 나눈다. 필터 조건은 쿼리 파라미터로 보낸다 (이름은 구현 시 확정).
- **확정**: 컬럼 3개 고정, 목록 전체 반환(페이지네이션 없음), 서버 순서를 그대로 쓴다.
- **미정**: 로딩·오류 상태의 표시, 카드가 하나도 없는 보드의 표시.
- **테스트**: TC-UI-001~003

## UI-C02 BoardColumn (`widgets/board-column`) ⏳

- **책임**: 한 상태의 컬럼. 헤더(상태 이름, [정렬 메뉴](03-board-controls.md)), 카드 목록, 하단 인라인 생성 입력 자리를 가진다. 드래그의 놓기 대상이다.
- **입력**: 컬럼의 상태, 그 상태의 티켓 목록(서버 순서).
- **확정**: 정렬은 컬럼 단위이므로 정렬 메뉴는 컬럼 헤더에 둔다 (D-56).
- **미정**: 빈 컬럼의 표시, 인라인 생성 입력이 어느 컬럼에 있는지([open_questions](../open_questions.md#ui)).
- **테스트**: TC-UI-001~003

## UI-C03 TicketCard (`entities/ticket`) ⏳

- **책임**: 티켓 한 장을 보여준다. 제목과 우선순위·마감일·태그 배지를 표시하고, 클릭하면 [상세 모달](02-ticket-editing.md)을 연다 (D-56).
- **입력**: 티켓(`ticketId`, `title`, `priority`, `dueAt`, `tags`).
- **확정**: 우선순위는 항상 있으므로 우선순위 배지는 항상 표시한다. 마감일 배지는 마감일이 있을 때만, 태그 배지는 태그가 있을 때만 표시한다. 내부 PK는 없다(API가 노출하지 않음).
- **상호작용**: 클릭 → 상세 모달, 드래그 → [이동](03-board-controls.md).
- **테스트**: TC-UI-004~008

## UI-C04 PriorityBadge (`entities/ticket`) ⏳

- **책임**: `LOW` / `MEDIUM` / `HIGH` / `URGENT` 네 단계를 구분해 표시한다 (FR-06).
- **미정**: 각 단계의 표시 문구와 색.
- **테스트**: TC-UI-005

## UI-C05 DueDateBadge (`entities/ticket`) ⏳

- **책임**: 마감일을 표시한다. 서버는 UTC로 주고 표시할 때 변환한다 (FR-05).
- **미정**: 표시 형식, 임박·초과 강조 여부 ([open_questions](../open_questions.md#ui)의 "마감일 표시 방식").
- **테스트**: TC-UI-006

## UI-C06 TagBadge (`entities/ticket`) ⏳

- **책임**: 태그 이름을 표시한다. 서버가 소문자로 정규화한 값을 그대로 보여준다 (FR-07).
- **테스트**: TC-UI-007
