# Feature Specification: 티켓 태그

**Status**: 구현 완료 (2026-09-21, TC-API-083~092 통과)

참조: [FR-07](../../docs/functional_requirements.md), [data_model — tag/ticket_tag](../../docs/data_model.md), [API 명세](../../docs/api_spec.md).

## 범위

생성(`POST`)·수정(`PATCH`) 본문의 `tags`(문자열 배열)와 모든 티켓 응답의 `tags`. 태그 필터는 008, 웹 UI는 009. 001·003의 `tags` 임시 거부 규칙(TC-API-023·046)은 이 기능에서 폐기한다.

## 결정 (D-99)

- 태그 이름은 앞뒤 공백 제거 후 소문자로 정규화하고(`Docs`=`docs`) 정규화 뒤 중복은 하나로 합친다. 빈 이름은 거부, 최대 30자, **정규화·중복 제거 뒤** 티켓당 최대 10개. 위반은 `400 VALIDATION_FAILED`(`details.field`=`tags`).
- 응답의 `tags`는 항상 있으며 이름 오름차순이다(없으면 `[]`).
- `PATCH`의 `tags`는 집합을 통째로 바꾼다(`[]`는 모두 제거, 생략은 유지, `null`은 거부).
- 저장: `tag`(`id` bigserial, `name` varchar(30) unique)와 `ticket_tag`(`ticket_id`, `tag_id`, 복합 PK, 둘 다 FK, 티켓 삭제 시 연결 삭제). 쓰지 않게 된 태그 행은 정리하지 않는다. 공개 식별자는 없다.
- 이 규칙은 도메인 불변식이 아니라 입력 정규화이므로 값 정규화 함수 `normalizeTags`가 맡는다(data_model 그대로).

## Requirements

- **FR-001** 위 규칙. **FR-002** TDD(TC 정의 → RED → GREEN).
