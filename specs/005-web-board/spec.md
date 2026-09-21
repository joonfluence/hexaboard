# Feature Specification: 웹 보드 (프론트엔드)

**Feature Branch**: `development` (디렉터리 이름만 `005-web-board`)

**Created**: 2026-09-21

**Status**: 구현 완료 (2026-09-21, TC-UI 35건 통과, 태그·필터·정렬 UI 보류)

**Input**: 사용자 요청 "목록 조회·수정·삭제, 카드 이동, 프론트엔드 작업들 쭉 진행하자" 중 프론트엔드

> 정본은 `docs/`다. 참조: [wireframe](../../docs/wireframe.md), [component_spec](../../docs/component_spec.md), [test_cases/04-ui](../../docs/test_cases/04-ui.md), [TRD 04 FSD 배치](../../docs/trd/04-layer-boundaries.md), [API 명세](../../docs/api_spec.md).

## 범위

**포함**: 상태별 보드(3개 컬럼), 카드(제목·우선순위·마감일 배지), 인라인 생성, 상세 모달(제목·설명·우선순위·마감일 수정과 삭제), 드래그 이동(낙관적 업데이트·실패 롤백·재조회·토스트), 로딩·오류·빈 상태. 선행으로 백엔드 CORS 허용과 OpenAPI 생성·`packages/api-client`를 만든다.

**제외(백엔드가 아직 없어 보류 → 009에서 구현 완료)**: 태그 UI(UI-C06, TC-UI-007·017), 검색·필터(UI-C09, TC-UI-018~022), 컬럼 정렬 메뉴(UI-C10, TC-UI-023~026). 해당 백엔드 기능을 만들 때 함께 구현한다.

## 결정 (D-96 UI, D-97 계약·CORS)

- 인라인 생성 입력은 **`TODO` 컬럼 하단에만** 둔다(생성은 항상 `TODO`).
- 상세 모달은 **명시적 "저장" 버튼**으로 저장한다(자동 저장 없음). 저장 전에는 요청을 보내지 않는다.
- 삭제는 **모달 안 "삭제" 버튼 → 확인 단계("정말 삭제할까요?", 삭제/취소)**로 진행한다.
- 마감일은 `M월 D일 HH:mm`(브라우저 시간대)로 표시하고 지났으면 "초과"로 강조한다(임박 강조 없음). 우선순위 표시는 낮음/보통/높음/긴급이며 색으로도 구분한다.
- 로딩 중에는 "불러오는 중", 조회 실패 시 오류 문구와 "다시 시도" 버튼, 카드가 없는 컬럼은 "카드 없음"을 보여 준다. 토스트 문구는 "카드를 옮기지 못했어요. 목록을 다시 불러왔습니다." 5초 뒤 사라진다.
- 드래그 테스트 방식(미결 해소): 드래그 결과를 요청으로 바꾸는 규칙을 순수 함수 `planMove`로 분리해 단위 테스트하고, 이동 훅(낙관적 업데이트·롤백·재조회·토스트)은 Testing Library로 테스트한다. dnd-kit 포인터 상호작용 자체는 E2E(2차)에서 다룬다.
- 서버 상태는 TanStack Query, 호출은 openapi-fetch(`api-client`). 프론트는 오류 응답의 `code`로 분기한다.
- API 계약: `bootstrap-http`가 OpenAPI(`packages/api-client/openapi.json`)를 생성하고 `openapi-typescript`로 타입을 만들어 커밋한다(수동 명령 `pnpm generate:api`). 브라우저 직접 호출을 위해 서버는 `CORS_ALLOWED_ORIGINS`(쉼표 구분)에 있는 오리진만 허용한다(비어 있으면 허용 없음).

## Functional Requirements

- **FR-001**: 목록을 한 번 받아 `status`로 컬럼을 나누고 서버 순서를 그대로 보여 준다.
- **FR-002**: 이동 요청은 `position`을 계산하거나 보내지 않고 기준 카드와 `BEFORE`/`AFTER`로 보낸다.
- **FR-003**: 이동 실패 시 원위치·재조회·토스트, 자동 재시도 없음.
- **FR-004**: TDD로 진행한다. 컴포넌트는 명세와 TC-UI 정의 뒤에 RED → GREEN.
