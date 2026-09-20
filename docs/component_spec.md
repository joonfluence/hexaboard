# 컴포넌트 명세 (프론트엔드 UI)

`apps/web`의 UI 컴포넌트 명세다. 확정된 결정에서 옮긴 내용만 "확정"으로 적고, 문서에 근거가 없는 것은 **미정**으로 남긴다. 아직 `apps/web`은 구현 전이라 모든 컴포넌트가 ⏳ 미구현이다.

## 규칙

- 컴포넌트를 구현하기 전에 이 명세의 해당 항목과 [test_cases/04-ui.md](test_cases/04-ui.md)의 테스트 케이스(TC-UI)를 먼저 정의한다. TC-UI가 있어야 컴포넌트 테스트의 RED를 쓴다 (헌법 III).
- 화면 구성은 [wireframe.md](wireframe.md), 동작 규칙은 [functional_requirements.md](functional_requirements.md), API는 [api_spec.md](api_spec.md)가 정본이다. 이 문서는 복제하지 않고 링크한다.
- FSD 배치는 [TRD 04](trd/04-layer-boundaries.md)를 따른다 (`app` → `views` → `widgets` → `features` → `entities` → `shared`, `pages`는 `views`로 개명).
- 서버 상태는 TanStack Query + openapi-fetch로 다루고, 프론트는 오류 응답의 `message`가 아니라 `code`로 분기한다 ([api_spec.md](api_spec.md)).

## 확정된 공통 전제

- 컬럼은 상태 3개(`TODO` / `IN_PROGRESS` / `DONE`)로 고정이다 (FR-03, 사용자 정의 컬럼 없음).
- 목록은 페이지네이션 없이 전체를 받는다 (D-63). 컬럼 안 순서는 서버가 준 순서 그대로다.
- 클라이언트는 순서 값(`position`)을 계산하거나 보내지 않는다. 이동은 기준 카드와 앞/뒤로 요청한다 (FR-04, D-42).
- 프론트 테스트는 순수 로직 단위 + 컴포넌트(Testing Library)이며 E2E는 2차다 (D-71).

## 컴포넌트 목록

| ID | 컴포넌트 | FSD 배치(예정) | 관련 기능 | 문서 | 상태 |
|----|----------|----------------|-----------|------|------|
| UI-C01 | BoardView | `views/board` | FR-03 | [01-board](component_spec/01-board.md) | ⏳ |
| UI-C02 | BoardColumn | `widgets/board-column` | FR-03 | [01-board](component_spec/01-board.md) | ⏳ |
| UI-C03 | TicketCard | `entities/ticket` | FR-03, FR-05~07 | [01-board](component_spec/01-board.md) | ⏳ |
| UI-C04 | PriorityBadge | `entities/ticket` | FR-06 | [01-board](component_spec/01-board.md) | ⏳ |
| UI-C05 | DueDateBadge | `entities/ticket` | FR-05 | [01-board](component_spec/01-board.md) | ⏳ |
| UI-C06 | TagBadge | `entities/ticket` | FR-07 | [01-board](component_spec/01-board.md) | ⏳ |
| UI-C07 | InlineTicketForm | `features/create-ticket` | FR-01 | [02-ticket-editing](component_spec/02-ticket-editing.md) | ⏳ |
| UI-C08 | TicketDetailModal | `features/edit-ticket` | FR-01, FR-05~07 | [02-ticket-editing](component_spec/02-ticket-editing.md) | ⏳ |
| UI-C09 | FilterBar | `features/filter-tickets` | FR-08 | [03-board-controls](component_spec/03-board-controls.md) | ⏳ |
| UI-C10 | ColumnSortMenu | `features/sort-column` | FR-09 | [03-board-controls](component_spec/03-board-controls.md) | ⏳ |
| UI-C11 | MoveTicket (드래그 조립) | `features/move-ticket` | FR-04 | [03-board-controls](component_spec/03-board-controls.md) | ⏳ |
| UI-C12 | Toast | `shared/ui` | FR-04(실패 알림) | [03-board-controls](component_spec/03-board-controls.md) | ⏳ |

## 미결

UI 관련 미결은 [open_questions.md](open_questions.md#ui)를 본다. 이 명세에서 **미정**으로 표시한 항목이 거기에 대응한다.
