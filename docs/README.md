# 문서 지도

To-do-app 기획·설계 문서 모음이다. **한 문서는 200줄을 넘기지 않고**, 넘으면 하위 문서로 쪼갠다.

| 문서 | 내용 |
|------|------|
| [PRD.md](PRD.md) | 제품 개요, MVP 범위, 2차 제외 범위 (시나리오·기능 목록은 링크) |
| [requirements.md](requirements.md) | 요구사항 체계(ID, 우선순위)와 추적 매트릭스 |
| [functional_requirements.md](functional_requirements.md) | 기능 요구사항, 핵심 기능 목록 |
| [non_functional_requirements.md](non_functional_requirements.md) | 비기능 요구사항 |
| [user_stories.md](user_stories.md) | 사용자 스토리 (사용자 시나리오) |
| [wireframe.md](wireframe.md) | 와이어프레임 참고, UI 방향 |
| [tech_stack.md](tech_stack.md) | 기술 스택 요약표 |
| [TRD.md](TRD.md) | 기술 요구사항 문서. 하위 6개 문서는 [trd/](trd/) |
| [data_model.md](data_model.md) | 티켓 데이터 모델 |
| [api_spec.md](api_spec.md) | API 명세 |
| [open_questions.md](open_questions.md) | 아직 정하지 않은 미결 사항 |
| [decision_log.md](decision_log.md) | 확정된 결정과 근거 |
| [changelog.md](changelog.md) | 문서 변경 이력 |

## 읽는 순서

1. [PRD.md](PRD.md)로 무엇을 만드는지 파악한다.
2. [requirements.md](requirements.md)에서 기능·비기능 요구사항을 확인한다.
3. [TRD.md](TRD.md)와 [data_model.md](data_model.md)로 어떻게 만드는지 확인한다.
4. 아직 정해지지 않은 것은 [open_questions.md](open_questions.md)에서 본다.

## 작업별 읽을 문서

필요한 문서만 읽는다. 전부 읽을 필요는 없다.

| 작업 | 읽을 문서 |
|------|-----------|
| 무엇을 만드는지 파악 | [PRD.md](PRD.md), [functional_requirements.md](functional_requirements.md) |
| 새 기능 구현 (예: 카드 이동) | [functional_requirements.md](functional_requirements.md), [data_model.md](data_model.md), [api_spec.md](api_spec.md), [trd/04-layer-boundaries.md](trd/04-layer-boundaries.md) |
| API 추가·변경 | [api_spec.md](api_spec.md), [data_model.md](data_model.md), [trd/04-layer-boundaries.md](trd/04-layer-boundaries.md) |
| DB 스키마·마이그레이션 | [data_model.md](data_model.md), [trd/04-layer-boundaries.md](trd/04-layer-boundaries.md), [trd/03-data-flow.md](trd/03-data-flow.md), [trd/06-deployment.md](trd/06-deployment.md) |
| 프론트 화면 구현 | [wireframe.md](wireframe.md), [functional_requirements.md](functional_requirements.md), [api_spec.md](api_spec.md), [trd/04-layer-boundaries.md](trd/04-layer-boundaries.md) (FSD) |
| 패키지·모듈 구조 | [trd/01-system-architecture.md](trd/01-system-architecture.md), [trd/04-layer-boundaries.md](trd/04-layer-boundaries.md) |
| 개발환경·CI·배포 | [trd/05-dev-environment.md](trd/05-dev-environment.md), [trd/06-deployment.md](trd/06-deployment.md), [non_functional_requirements.md](non_functional_requirements.md) |
| 기술 선택 확인 | [tech_stack.md](tech_stack.md), [trd/02-tech-stack-detail.md](trd/02-tech-stack-detail.md) |
| 구현 전 미결 확인 | [open_questions.md](open_questions.md) (관련 항목이 있으면 지어내지 말고 사용자에게 묻는다) |

**필요할 때만 읽는 문서**: [decision_log.md](decision_log.md)는 결정의 이유가 궁금할 때, [changelog.md](changelog.md)는 변경 이력이 필요할 때만 읽는다. 결정이 쌓일수록 커지는 문서다.

## 작성 규칙

- 확정된 것만 본문에 적는다. 아직 답이 없는 항목은 지어내지 않고 [open_questions.md](open_questions.md)에 남긴다.
- 도메인 용어는 "티켓"을 쓴다.
- 결정이 바뀌면 [decision_log.md](decision_log.md)와 [changelog.md](changelog.md)를 함께 갱신한다.
