# 컴포넌트 명세 02. 티켓 생성과 편집

규칙은 [component_spec.md](../component_spec.md)를 본다. 테스트 케이스는 [04-ui.md](../test_cases/04-ui.md)에 있다.

## UI-C07 InlineTicketForm (`features/create-ticket`) ✅

- **책임**: 제목만 입력해 티켓을 만든다. 나머지 필드는 상세 모달에서 편집한다 (D-56).
- **API**: `POST /tickets`(제목만). 성공하면 새 티켓이 `TODO` 컬럼 맨 뒤에 나타난다 (D-79). 응답의 `ticketId`로 이후 조회·수정한다.
- **오류**: 서버가 `400 VALIDATION_FAILED`를 주면 `code`로 분기하고 필드별 `details`를 쓴다.
- **확정**: 제목은 필수이고 최대 100자다 (FR-01). 서버가 앞뒤 공백을 제거한다 (D-81). 입력창은 `TODO` 컬럼 하단에만 둔다 (D-96). 빈 제목은 클라이언트가 먼저 막고 안내 문구를 보여주며, 낙관적 업데이트 없이 서버 응답 성공 후 목록을 반영한다([inline-ticket-form.tsx](../../apps/web/src/features/create-ticket/ui/inline-ticket-form.tsx)가 정본).
- **테스트**: TC-UI-009~012

## UI-C08 TicketDetailModal (`features/edit-ticket`) ✅

- **책임**: 카드 클릭 시 열리는 상세 보기·편집 모달이다 (D-56). 제목, 설명, 우선순위, 마감일, 태그를 편집한다.
- **API**: `PATCH /tickets/{ticketId}`는 제목·설명·우선순위·마감일·태그만 받는다. **상태와 순서는 여기서 바꾸지 않는다** ([이동](03-board-controls.md)으로만 바꾼다). 필드 검증 실패는 `400`이며 `code`로 분기한다.
- **확정**: 제목 최대 100자, 설명 최대 2000자, 우선순위 필수(`null` 불가), 마감일 선택, 태그는 자유 입력이며 티켓당 최대 10개·이름 최대 30자·앞뒤 공백 제거 후 소문자로 정규화된다 (FR-01, FR-06, FR-07). 저장은 명시적 "저장" 버튼(바뀐 필드만 PATCH), 삭제는 모달 안 "삭제" → 확인 단계 (D-96). 태그는 Enter·"태그 추가"로 넣고 칩 "제거"로 뺀다. 태그 후보는 받아 둔 목록에서 뽑는다 (D-67, D-101).
- **테스트**: TC-UI-013~017
