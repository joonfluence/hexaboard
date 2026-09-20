# 문서 변경 이력

> 이전 단일 PRD(v0.1~v0.34)의 이력을 그대로 옮겼다. v0.35부터 문서를 주제별로 분할했다.

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| v0.1 | 2026-09-20 | 소크라틱 대화 기반 최초 초안 작성 | joonfluence (with Claude) |
| v0.2 | 2026-09-20 | `solo-prd` 스킬 구조(12섹션)로 재구성 — 제품 개요/사용자 시나리오/와이어프레임 참고/핵심 기능 목록/2차 제외 범위/기술 스택 요약표 추가. 미결 사항은 유지, 신규 답변 없음 | joonfluence (with Claude) |
| v0.3 | 2026-09-20 | 기술 스택 논의 결과 반영 — 기술 스택 요약표 채움(확정/잠정 구분), 완료 기준에 구조 연습 필수·best-effort 조건 추가, 2차 범위에 Next 서버 모델 학습 추가, 기술 스택 잔여 미결 항목 추가 | joonfluence (with Claude) |
| v0.4 | 2026-09-20 | 헥사고날(도메인-영속성 엔티티 분리), FSD 우회 방식 결정 반영, 후속 미결 항목 2건 추가 | joonfluence (with Claude) |
| v0.5 | 2026-09-20 | 도메인-영속성 분리 방식을 별도 영속성 엔티티 + 매퍼로 확정 | joonfluence (with Claude) |
| v0.6 | 2026-09-20 | 생성된 API 클라이언트를 별도 워크스페이스 패키지로 확정 | joonfluence (with Claude) |
| v0.7 | 2026-09-20 | 백엔드 계층 경계를 패키지(모듈) 단위로 강제하기로 확정 (weave-server 참고), 후속 미결 항목 추가 | joonfluence (with Claude) |
| v0.8 | 2026-09-20 | `application` 패키지에 Nest 데코레이터 허용으로 확정 | joonfluence (with Claude) |
| v0.9 | 2026-09-20 | 포트를 interface + Symbol 토큰으로 통일하기로 확정 | joonfluence (with Claude) |
| v0.10 | 2026-09-20 | 모노레포 패키지 구성(`bootstrap-http`, `domain`, `application`, `persistence`, `api-client`, `web`) 확정, 마이그레이션 위치 미결 항목 추가 | joonfluence (with Claude) |
| v0.11 | 2026-09-20 | 마이그레이션 파일은 `persistence`, CLI 설정·실행은 `bootstrap-http`로 확정 (순환 의존 방지 명시) | joonfluence (with Claude) |
| v0.12 | 2026-09-20 | FSD `pages` 레이어를 `views`로 개명하기로 확정 | joonfluence (with Claude) |
| v0.13 | 2026-09-20 | 테스트 도구를 백엔드 Jest, 프론트엔드 Vitest로 확정 | joonfluence (with Claude) |
| v0.14 | 2026-09-20 | 백엔드 테스트 범위(domain 단위, persistence 통합, API/컨트롤러) 확정, application 유스케이스 테스트는 2차로 이관 | joonfluence (with Claude) |
| v0.15 | 2026-09-20 | 테스트용 DB를 Testcontainers로 확정 | joonfluence (with Claude) |
| v0.16 | 2026-09-20 | CI 플랫폼(GitHub Actions)과 저장소(GitHub 공개) 확정, 시크릿 관리 방침 추가, 배포 관련 미결 항목 추가 | joonfluence (with Claude) |
| v0.17 | 2026-09-20 | 배포 환경을 단일 환경(`main`만 프로덕션 자동 배포)으로 확정, Vercel 프리뷰 처리 미결 항목 추가 | joonfluence (with Claude) |
| v0.18 | 2026-09-20 | 마이그레이션을 서버 기동 시 자동 실행하기로 확정, 실패·롤백 방침 미결 항목 추가 | joonfluence (with Claude) |
| v0.19 | 2026-09-20 | 도메인 용어 "티켓"(= 할 일, 테이블 `ticket`) 도입 | joonfluence (with Claude) |
| v0.20 | 2026-09-20 | 티켓 상태 enum(`TODO` / `IN_PROGRESS` / `DONE`) 결정 반영, MVP 범위에 "상태 관리" P0 추가, 상태 전이 규칙 미결 항목 추가 | joonfluence (with Claude) |
| v0.21 | 2026-09-20 | 상태 전이를 자유(제약 없음)로 확정, 관련 문구 정합성 수정, 도메인 불변식 연습 지점 미결 항목 추가 | joonfluence (with Claude) |
| v0.22 | 2026-09-20 | 도메인 불변식을 제목 검증(Title VO)만으로 확정, 관련 문구 정리 | joonfluence (with Claude) |
| v0.23 | 2026-09-20 | 우선순위 값 체계를 4단계로 확정, 필수 여부·저장/정렬 방식 미결 항목 추가 | joonfluence (with Claude) |
| v0.24 | 2026-09-20 | 우선순위를 필수(기본 `MEDIUM`), 숫자 저장 + 매퍼 변환으로 확정 | joonfluence (with Claude) |
| v0.25 | 2026-09-20 | 태그를 자유 입력 태그 + `tag` 테이블(N:M)로 확정, 카테고리 제외, 태그 세부 규칙 미결 항목 추가 | joonfluence (with Claude) |
| v0.26 | 2026-09-20 | 설명 필드(선택, text)와 마감일 timestamp 확정, 티켓 데이터 모델 초안 추가, `id` 전략 등 잔여 필드 미결 항목 추가 | joonfluence (with Claude) |
| v0.27 | 2026-09-20 | 티켓 `id`를 도메인에서 생성하는 UUID로 확정, UUID 버전 미결 항목 추가 | joonfluence (with Claude) |
| v0.28 | 2026-09-20 | UUID v7, 마감일 선택, 기본 상태 `TODO`, `created_at`/`updated_at` 도입 확정, 데이터 모델 초안 갱신 및 파생 미결 항목 추가 | joonfluence (with Claude) |
| v0.29 | 2026-09-20 | UI 화면 구조를 상태별 보드형(Trello 참조)으로 확정, 와이어프레임 참고 섹션 갱신, UI 파생 미결 항목 추가 | joonfluence (with Claude) |
| v0.30 | 2026-09-20 | 컬럼 안 카드 순서를 수동 지정(드래그)으로 확정, `position` 필드 추가, 정렬 기능과의 충돌 등 파생 미결 항목 추가 | joonfluence (with Claude) |
| v0.31 | 2026-09-20 | 정렬을 순서 덮어쓰기 방식으로 확정, 정렬 세부 미결 항목 추가 | joonfluence (with Claude) |
| v0.32 | 2026-09-20 | `position`을 문자열 순서 키로 확정, collation·구현 방식·이동 API·계산 위치 미결 항목 추가 | joonfluence (with Claude) |
| v0.33 | 2026-09-20 | 이동 API(기준 카드 앞/뒤), 순서 키 계산 위치(`domain`의 Position 값 객체), 직접 구현 확정 | joonfluence (with Claude) |
| v0.34 | 2026-09-20 | 스타일링(Tailwind CSS + shadcn/ui)과 드래그앤드롭(dnd-kit) 확정, 기술 스택 요약표의 TBD 항목 해소 | joonfluence (with Claude) |
| v0.35 | 2026-09-20 | 단일 PRD를 주제별 문서로 분할(PRD, requirements, functional/non_functional_requirements, user_stories, wireframe, tech_stack, TRD 6종, data_model, api_spec, open_questions, decision_log). 정합성 점검: "할 일"을 "티켓"으로 통일, 결정됐으나 빠져 있던 보드 화면·카드 이동을 P0 기능(FR-03, FR-04)에 추가, 확정 항목 안에 숨어 있던 미결(프론트 테스트 범위, `shared`-`api-client` 연결)을 분리, 신규 미결(인증 없는 공개 배포의 접근 통제, 로컬 개발용 DB) 추가 | joonfluence (with Claude) |
| v0.36 | 2026-09-20 | 인증 없는 공개 배포의 위험 수용(인증은 향후 고도화에서 추가)과 로컬 개발용 DB(PostgreSQL) 확정. 해당 미결 항목 정리, 로컬 PostgreSQL 실행 방식 미결 항목 추가 | joonfluence (with Claude) |
| v0.37 | 2026-09-20 | API를 RESTful `tickets` 리소스로 정의(엔드포인트 초안), `solo-prd` 스킬을 분할 문서 구조에 맞춰 갱신 | joonfluence (with Claude) |
| v0.38 | 2026-09-20 | API 명세에 클라이언트 요청 오류(4xx) 예외를 엔드포인트별로 추가, 오류 코드·응답 형식 초안과 관련 미결 항목 추가 | joonfluence (with Claude) |
| v0.39 | 2026-09-20 | 티켓 공개 식별자 `ticketId`를 DB PK와 분리한 별도 유니크 키로 확정(보안), 데이터 모델·API·TRD 반영, 내부 PK 타입과 UUID 버전 재검토 미결 항목 추가 | joonfluence (with Claude) |
| v0.40 | 2026-09-20 | README에 "작업별 읽을 문서" 표와 "필요할 때만 읽는 문서" 표시 추가, 에이전트용 진입점 루트 `CLAUDE.md` 추가, `solo-prd` 스킬 반영 | joonfluence (with Claude) |
| v0.41 | 2026-09-20 | 공개 식별자 `ticketId`의 UUID 버전을 v7에서 v4로 변경(생성 시각 비노출), 관련 문서와 미결 항목 정리 | joonfluence (with Claude) |
| v0.42 | 2026-09-20 | 미결 사항에 진행 우선순위 표 추가 (첫 구현에 들어가 바꾸기 비싼 것부터 5단계) | joonfluence (with Claude) |
| v0.43 | 2026-09-20 | 카드 이동(`PUT .../position`)·정렬(`POST /tickets/sort`) 모델링을 초안에서 확정, 컬럼 간 이동 시 순서 처리 정리(순서 키는 컬럼 안에서만 비교) | joonfluence (with Claude) |
| v0.44 | 2026-09-20 | 동시 이동 충돌을 (상태, 순서 키) 유니크 제약 + 서버 재시도 + `409`로 확정, 미결 우선순위 표 재정렬 | joonfluence (with Claude) |
| v0.45 | 2026-09-20 | 내부 PK(`bigint` 자동 증가), `status`(문자열 + CHECK), 시각 필드(ORM 훅), `position` collation(컬럼 지정) 확정 | joonfluence (with Claude) |
| v0.46 | 2026-09-20 | 제목·설명 길이(100자·2000자), 우선순위 생략 시 기본값 적용, 서버가 정하는 값은 `400` 거부 확정 | joonfluence (with Claude) |
| v0.47 | 2026-09-20 | API 오류 코드·응답 형식 초안을 확정 | joonfluence (with Claude) |
| v0.48 | 2026-09-20 | 컬럼명 확정: 내부 PK `id`, 공개 식별자 `public_id` | joonfluence (with Claude) |
| v0.49 | 2026-09-20 | 태그 규칙(정규화, 이름 유니크, 30자, 티켓당 10개)과 `tag` 스키마 확정 | joonfluence (with Claude) |
| v0.50 | 2026-09-20 | 정렬 세부 확정(컬럼 단위, 우선순위·마감일 기준, 마감일 null은 맨 뒤, undo 없음), 정렬 요청 본문 정의 | joonfluence (with Claude) |
| v0.51 | 2026-09-20 | 보드 UI를 Trello 조합으로 확정(카드 배지, 인라인 생성, 상세 모달, 상단 필터 바, 컬럼 헤더 정렬 메뉴), 와이어프레임 갱신 | joonfluence (with Claude) |
| v0.52 | 2026-09-20 | 필터 적용 중 정렬 비활성화 확정, 관련 미결 항목 정리 | joonfluence (with Claude) |
| v0.53 | 2026-09-20 | FSD `shared/api`–`api-client` 연결 방식 확정, 미결 우선순위 표 정리 | joonfluence (with Claude) |
| v0.54 | 2026-09-20 | 로컬 PostgreSQL 실행 방식을 Docker Compose로 확정 | joonfluence (with Claude) |
| v0.55 | 2026-09-20 | Node 버전 고정 방식을 `.nvmrc` + `engines`로 확정 | joonfluence (with Claude) |
| v0.56 | 2026-09-20 | 린트·포맷 도구를 ESLint + Prettier로 확정 | joonfluence (with Claude) |
| v0.57 | 2026-09-21 | 커밋·PR 규칙 확정(Conventional Commits 관례, 도구 강제 없음) | joonfluence (with Claude) |
| v0.58 | 2026-09-21 | 목록 조회를 페이지네이션 없이 전체 반환으로 확정 | joonfluence (with Claude) |
| v0.59 | 2026-09-21 | 목록 필터 조합 규칙 확정(AND, 제목+설명 검색, 태그 OR, 서버 쿼리 파라미터), FR-08 갱신 | joonfluence (with Claude) |
| v0.60 | 2026-09-21 | 마감일 조건 필터 미제공 확정 | joonfluence (with Claude) |
| v0.61 | 2026-09-21 | API 버전 관리를 URL 경로 `/v1`로 확정 | joonfluence (with Claude) |
| v0.62 | 2026-09-21 | 태그 목록 조회 API 미제공 확정 | joonfluence (with Claude) |
| v0.63 | 2026-09-21 | 카드 이동 실패 시 프론트 롤백 방식 확정 | joonfluence (with Claude) |
| v0.64 | 2026-09-21 | 동시 이동 충돌 시 서버 재시도 횟수를 최대 3회로 확정 | joonfluence (with Claude) |
| v0.65 | 2026-09-21 | 순서 키 재정규화는 정렬 실행으로 갈음하기로 확정, 키 길이 상한은 미결로 남김 | joonfluence (with Claude) |
| v0.66 | 2026-09-21 | 프론트엔드 테스트 범위 확정(순수 로직 + 컴포넌트, E2E 제외), 드래그 테스트 방식 미결 추가 | joonfluence (with Claude) |
| v0.67 | 2026-09-21 | 마이그레이션 실패 시 기동 중단 + 수동 복구 확정, 데이터 흐름 문서의 낡은 미정 문구 갱신 | joonfluence (with Claude) |
| v0.68 | 2026-09-21 | OpenAPI 스펙 파일 위치(`api-client`)와 Turborepo `generate` 태스크 연결 확정 | joonfluence (with Claude) |
| v0.69 | 2026-09-21 | OpenAPI 어긋남 CI 검증(생성 후 diff) 확정 | joonfluence (with Claude) |
| v0.70 | 2026-09-21 | Vercel 프리뷰 배포 비활성화, CORS 허용 오리진은 프로덕션 도메인 하나로 확정 | joonfluence (with Claude) |
| v0.71 | 2026-09-21 | 배포 롤백 절차를 git revert 후 재배포로 확정 | joonfluence (with Claude) |
| v0.72 | 2026-09-21 | Neon·Render 무료 플랜 공식 페이지 확인 후 잠정→확정, GitHub Actions 공개 저장소 무료 확인 | joonfluence (with Claude) |
| v0.73 | 2026-09-21 | 정합성 점검: 결정된 항목에 남아 있던 낡은 "미정·미결" 문구 7곳 갱신, 문서에만 있고 미결 목록에 빠져 있던 마감일 표시 방식·응답 시간 목표를 미결에 추가, 미사용 "잠정" 범례 제거 | joonfluence (with Claude) |
| v0.74 | 2026-09-21 | SDD(Spec Kit)·TDD 도입 확정, 프로젝트 헌법 v1.0.0 작성(`.specify/memory/constitution.md`) | joonfluence (with Claude) |
| v0.75 | 2026-09-21 | 새 티켓은 `TODO` 컬럼 맨 뒤에 놓기, 응답에 `position` 미노출 확정 (첫 기능 명세 `specs/001-ticket-create-get` 작성 중 결정) | joonfluence (with Claude) |
| v0.76 | 2026-09-21 | 제목 공백 제거, 빈 설명 정규화, 미지 요청 필드 무시 확정 (`/speckit-clarify` 결과) | joonfluence (with Claude) |
| v0.77 | 2026-09-21 | 헌법 v1.1.0: 원칙 VI(TS strict, any 금지, API 계약 준수) 추가, 개발환경 문서에 반영 | joonfluence (with Claude) |
