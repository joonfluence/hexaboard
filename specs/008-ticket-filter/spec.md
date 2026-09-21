# Feature Specification: 검색·필터

**Status**: 구현 완료 (2026-09-21, TC-API-093~100 통과)

참조: [FR-08](../../docs/functional_requirements.md), [API 명세 — 목록 조회](../../docs/api_spec.md).

## 범위

`GET /v1/tickets`의 쿼리 파라미터. 웹 UI는 009.

## 결정 (D-100)

- 파라미터: `q`(검색어), `status`, `priority`, `tag`. `status`·`priority`·`tag`는 반복해 여러 값을 줄 수 있고(`tag=a&tag=b`) **같은 종류 안에서는 OR**, **서로 다른 종류는 AND**다(FR-08).
- `q`는 앞뒤 공백을 제거하고 제목·설명에서 대소문자를 구분하지 않는 부분 일치로 찾는다(`%`·`_`·`\`는 글자 그대로). 빈 `q`는 무시한다.
- `tag`는 정규화(공백 제거·소문자)해 비교한다. 빈 값은 무시한다.
- `status`·`priority`가 허용 값 밖이면 `400 VALIDATION_FAILED`(`details.field`). 정의되지 않은 파라미터는 무시한다.
- 결과 정렬과 응답 형식은 필터 없는 목록과 같다(상태 순서, 컬럼 안 순서). 마감일 조건 필터는 없다(D-65).

## Requirements

- **FR-001** 위 규칙. **FR-002** TDD(TC 정의 → RED → GREEN).
