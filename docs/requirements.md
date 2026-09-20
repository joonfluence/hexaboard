# 요구사항 개요

요구사항 문서의 구성과 ID 체계, 사용자 스토리와 기능 요구사항의 연결을 정리한다.

## 문서 구성

| 문서 | ID | 내용 |
|------|----|------|
| [user_stories.md](user_stories.md) | US-xx | 사용자 관점의 요구 |
| [functional_requirements.md](functional_requirements.md) | FR-xx | 시스템이 제공할 기능 |
| [non_functional_requirements.md](non_functional_requirements.md) | NFR-xx | 성능, 보안, 비용 등 품질 요구 |

## 우선순위

| 표기 | 의미 |
|------|------|
| P0 | MVP 완료에 필수 |
| best-effort | 미완이어도 MVP 완료로 인정 |

## 추적 매트릭스 (사용자 스토리 → 기능 요구사항)

| 사용자 스토리 | 기능 요구사항 |
|---------------|---------------|
| US-01 티켓 추가 | FR-01, FR-02 |
| US-02 티켓 조회/수정/삭제 | FR-01 |
| US-03 마감일 지정 | FR-05 |
| US-04 우선순위 지정 | FR-06 |
| US-05 태그 분류 | FR-07 |
| US-06 검색·필터 | FR-08 |
| US-07 정렬 | FR-09 |
| US-08 상태 변경 | FR-02, FR-03, FR-04 |
| US-09 컬럼 안 순서 지정 | FR-04 |

## 관련 설계 문서

- 데이터 필드 규칙: [data_model.md](data_model.md)
- API 동작 목록: [api_spec.md](api_spec.md)
- 화면: [wireframe.md](wireframe.md)
- 아직 정해지지 않은 요구: [open_questions.md](open_questions.md)
