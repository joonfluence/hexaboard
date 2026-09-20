# To-do-app PRD

- **버전**: v0.73 · **상태**: Draft (불완전, 계속 보강) · **작성**: joonfluence (with Claude)
- 미결 사항은 [open_questions.md](open_questions.md), 결정 근거는 [decision_log.md](decision_log.md), 문서 지도는 [README.md](README.md)를 본다.

## 1. 제품 개요

### 무엇인가

실사용 서비스가 아니라 **풀스택 개발 연습**이 목적인 학습용 to-do 앱이다. 티켓을 상태별 보드(Trello 참조)에서 관리한다. 프론트엔드 — 백엔드 API — DB — 배포까지 한 사이클을 직접 경험하는 것이 핵심이며, 기능의 참신함이나 시장 차별성은 우선순위가 아니다.

도메인(to-do)에 비해 구조가 과한 것은 의도된 것이다. 엔터프라이즈 수준의 구조를 연습하는 것이 학습 목적이며, 생산성은 최대한 유지한다.

### 용어

- **티켓**: 이 앱의 도메인 용어이자 DB 테이블명(`ticket`). 흔히 말하는 "할 일"과 같은 개념이다.

### 학습 목표

- 프론트엔드(웹) — 백엔드 API — DB로 이어지는 풀스택 흐름을 직접 구현
- 배포까지 포함해 "실제로 URL로 접근 가능한" 결과물을 만드는 경험
- 도메인 로직 연습: `domain`의 값 객체 구현 (Title 검증, Position 순서 키 계산)
- 프론트엔드에서 상태 기반 UI(드래그, 낙관적 업데이트 등)를 다루는 연습
- 엔터프라이즈 구조 연습 (필수): 백엔드 헥사고날 구조, FE-BE API 계약 공유, DB 마이그레이션 관리
- 엔터프라이즈 구조 연습 (best-effort): 자동화 테스트 + CI/CD

### 대상 사용자

| 사용자 유형 | 설명 | 비고 |
|------------|------|------|
| 개발자 본인 | 단일 사용자. 계정/인증 없이 본인만 사용하는 것을 전제로 함 | 멀티 유저·인증은 2차 범위 |

## 2. MVP 범위

### In-Scope

| 기능 | 요구사항 |
|------|----------|
| 티켓 CRUD | [FR-01](functional_requirements.md) |
| 상태 관리 (`TODO` / `IN_PROGRESS` / `DONE`) | [FR-02](functional_requirements.md) |
| 상태별 보드 화면 | [FR-03](functional_requirements.md) |
| 카드 이동 (상태 변경 + 컬럼 안 수동 순서) | [FR-04](functional_requirements.md) |
| 마감일 | [FR-05](functional_requirements.md) |
| 우선순위 | [FR-06](functional_requirements.md) |
| 태그 | [FR-07](functional_requirements.md) |
| 검색 / 필터 | [FR-08](functional_requirements.md) |
| 정렬 | [FR-09](functional_requirements.md) |

### 범위 조건

- **플랫폼**: 웹 앱. 백엔드 서버 + DB 사용 (로컬 스토리지 아님)
- **인증**: 없음. 단일 사용자 가정. 공개 배포에서 누구나 접근할 수 있는 위험은 수용하고, 인증은 향후 고도화에서 추가한다
- **배포**: MVP에 포함. 실제 접근 가능한 URL까지 배포해야 완료. 유휴 후 첫 로딩 지연은 허용

### 완료 기준

**필수 조건**
- 위 In-Scope 기능이 모두 구현됨
- 배포되어 실제 URL로 접근 가능함
- 백엔드 헥사고날 구조(도메인 모델과 영속성 엔티티 분리), FE-BE API 계약 공유(OpenAPI), DB 마이그레이션 관리가 갖춰짐

**best-effort** (미완이어도 MVP 완료로 인정)
- 자동화 테스트 + CI/CD

## 3. 2차 제외 범위

다음 버전 후보다. 이번 MVP에서는 하지 않는다.

- **인증(로그인/회원가입)**: 향후 고도화하면서 추가한다. 인증이 없는 공개 배포의 접근 통제 위험도 이때 해소한다
- **Next.js 서버 모델 학습**: 서버 컴포넌트, Server Actions, 스트리밍(Suspense). 인증 도입 시(쿠키 세션, 미들웨어) 본격 학습
- **`application` 유스케이스 단위 테스트** (Fake 포트 사용)
- **E2E 테스트** (Playwright)
- **사전 정의 카테고리**: 이번에는 자유 입력 태그만 사용
- **반복 티켓**, **하위 티켓(subtask)**, **알림/리마인더**: MVP 후보로 선택되지 않음

## 4. 사용자 시나리오

[user_stories.md](user_stories.md)를 본다.

## 5. 핵심 기능 목록

[functional_requirements.md](functional_requirements.md#핵심-기능-목록)를 본다.

## 6. 관련 문서

- 요구사항: [requirements.md](requirements.md)
- UI: [wireframe.md](wireframe.md)
- 기술: [tech_stack.md](tech_stack.md), [TRD.md](TRD.md)
- 데이터·API: [data_model.md](data_model.md), [api_spec.md](api_spec.md)
