# Feature Specification: 컬럼 정렬

**Status**: 구현 완료 (2026-09-21, TC-API-075~082 통과)

참조: [FR-09](../../docs/functional_requirements.md), [API 명세 — 정렬](../../docs/api_spec.md), [테스트 케이스](../../docs/test_cases.md).

## 범위

`POST /v1/tickets/sort`(`204`). 본문 `status`, `sortBy`(`PRIORITY`/`DUE_AT`), `direction`(`ASC`/`DESC`). 그 컬럼 카드의 순서 키를 다시 계산해 저장한다(수동 순서 덮어쓰기, 실행 취소 없음). 웹 UI는 009에서 다룬다.

## 결정 (D-98)

- 우선순위 `ASC`는 LOW→URGENT, `DESC`는 반대. 마감일 `ASC`는 이른 순, `DESC`는 늦은 순이며 **마감일이 없는 티켓은 방향과 무관하게 맨 뒤**.
- 같은 값끼리는 기존 컬럼 순서를 유지한다(안정 정렬).
- 새 순서 키는 `first()`부터 `after()`로 이어 만들어 키가 짧아진다. 한 트랜잭션에서 임시 키를 거쳐 갱신해 (상태, 순서 키) 유니크 제약과 충돌하지 않는다. 동시 생성과 부딪쳐 유니크 위반이 나면 `409 POSITION_CONFLICT`.
- 빈 컬럼도 `204`. 검증 실패는 `400 VALIDATION_FAILED`.

## Requirements

- **FR-001** 위 규칙으로 정렬한다. **FR-002** TDD(TC 정의 → RED → GREEN).
