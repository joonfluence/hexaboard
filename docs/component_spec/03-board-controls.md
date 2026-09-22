# 컴포넌트 명세 03. 보드 조작 (필터·정렬·이동)

규칙은 [component_spec.md](../component_spec.md)를 본다. 테스트 케이스는 [04-ui.md](../test_cases/04-ui.md)에 있다.

## UI-C09 FilterBar (`features/filter-tickets`) ✅

- **책임**: 보드 상단 바에서 검색어·우선순위·태그로 티켓을 거른다 ([FR-08](../functional_requirements.md), D-56).
- **확정**:
  - 서로 다른 종류의 조건은 AND, 태그를 여러 개 고르면 하나라도 가진 티켓(OR)이다 (D-64).
  - 검색어는 제목과 설명의 부분 일치이고 250ms 디바운스로 서버 쿼리 파라미터(`q`)를 실행한다. 우선순위는 체크박스(OR), 태그는 칩(OR)이다 (D-100, D-101).
  - **마감일 조건 필터는 없다** (D-65). 태그 후보는 받아 둔 티켓 목록에서 뽑고 태그 목록 API는 없다 (D-67).
  - "필터 해제" 버튼으로 모든 조건을 지운다 (D-101).
- **테스트**: TC-UI-018~022

## UI-C10 ColumnSortMenu (`features/sort-column`) ✅

- **책임**: 컬럼 헤더 메뉴에서 기준(우선순위·마감일)과 방향(오름·내림)을 고르고 실행하면 그 컬럼의 순서를 다시 저장한다 (FR-09, D-55).
- **API**: `POST /tickets/sort` — 본문 `status`, `sortBy`(`PRIORITY`/`DUE_AT`), `direction`(`ASC`/`DESC`), 성공은 `204`.
- **확정**: 마감일이 없는 티켓은 방향과 무관하게 항상 맨 뒤다(서버가 처리). 실행 취소는 없다. **필터가 적용된 동안에는 메뉴를 비활성화한다** (D-57). 정렬 성공 뒤 목록을 재조회해 반영한다 (D-101).
- **테스트**: TC-UI-023~026

## UI-C11 MoveTicket (`features/move-ticket`) ✅

- **책임**: dnd-kit으로 카드를 다른 컬럼이나 같은 컬럼의 다른 위치로 옮긴다 (FR-04, D-31). 보드 로직은 직접 조립한다.
- **API**: `PUT /tickets/{ticketId}/position` — 본문 `status`, `anchorTicketId`, `placement`(`BEFORE`/`AFTER`). 대상 컬럼이 비어 있으면 기준 카드를 생략한다.
- **확정**:
  - 클라이언트는 `position` 값을 계산하거나 보내지 않는다.
  - 낙관적 업데이트: 응답을 기다리지 않고 배열 순서를 먼저 바꾼다. 필터 중에도 이동 가능하고 표시 중인 목록에 적용한다 (D-101).
  - 실패(`409`, `404`, 네트워크 오류 등)하면 원위치로 되돌리고 토스트로 알린 뒤 서버 상태로 목록을 재조회한다. **프론트는 자동 재시도하지 않는다** (서버가 이미 재시도함, D-68).
  - `PointerSensor`(거리 6px 활성화)와 `KeyboardSensor`를 함께 등록해 키보드로도 카드를 옮길 수 있다(NFR-09, [board-dnd.tsx](../../apps/web/src/features/move-ticket/ui/board-dnd.tsx)). dnd-kit 포인터 상호작용의 E2E 검증은 2차로 미룬다(D-96) — 컴포넌트 테스트는 `planMove` 순수 함수와 이동 훅(낙관적 업데이트·롤백·재조회·토스트)까지만 다룬다.
- **테스트**: TC-UI-027~035

## UI-C12 Toast (`shared/ui`) ✅

- **책임**: 카드 이동 실패를 사용자에게 알린다 (D-68). shadcn/ui 기반으로 직접 스타일링한다.
- **확정**: 표시 시간은 5초다 (D-96). 메시지 문구는 코드([toast.tsx](../../apps/web/src/shared/ui/toast.tsx))가 정본인 구현 세부다.
- **테스트**: TC-UI-033
