# 테스트 케이스 02. persistence (Testcontainers Postgres)

실제 Postgres(`postgres:18`)를 Testcontainers로 띄워 검증한다. 규칙은 [test_cases.md](../test_cases.md)를 본다. 스키마 정본은 [data_model.md](../data_model.md)다.

## 매퍼 — `packages/persistence/test/ticket.mapper.spec.ts` (DB 없음)

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-PER-001 | 도메인 → 엔티티 | `ticketId`가 `public_id` 값에 대응 | D-46, D-53 | ✅ |
| TC-PER-002 | 새 엔티티 | 내부 PK(`id`)가 아직 없음 | 헌법 IV | ✅ |
| TC-PER-003 | 우선순위 4종 | `LOW`=1, `MEDIUM`=2, `HIGH`=3, `URGENT`=4로 왕복 | data_model(값은 구현 시 확정 → 테스트로 고정) | ✅ |
| TC-PER-004 | 우선순위 숫자 순서 | `LOW` < `MEDIUM` < `HIGH` < `URGENT` | data_model | ✅ |
| TC-PER-005 | 알 수 없는 우선순위 숫자 | 거부 | data_model | ✅ |
| TC-PER-006 | 도메인 → 엔티티 → 도메인 | 값이 같음 | TRD 04 | ✅ |
| TC-PER-007 | 복원한 도메인 티켓 | 내부 PK 없음 | 헌법 IV | ✅ |

## 마이그레이션 — `packages/persistence/test/migration.int-spec.ts`

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-PER-008 | 컬럼 타입·널 허용 | `id` bigint, `public_id` uuid, `title` varchar(100), `description` text(널), `priority` smallint, `due_at`(널), 시각은 not null | data_model | ✅ |
| TC-PER-009 | 바이너리 정렬 | `position`만 `C` collation | D-50 | ✅ |
| TC-PER-010 | 연속 삽입 | `id` 자동 증가 | D-50 | ✅ |
| TC-PER-011 | `ARCHIVED` 등 범위 밖 상태 | CHECK 위반(23514) | D-50 | ✅ |
| TC-PER-012 | 같은 `public_id` 두 번 | 유니크 위반(23505) | D-46 | ✅ |
| TC-PER-013 | 같은 (상태, 순서 키) | 유니크 위반. 다른 상태의 같은 키는 허용 | D-49 | ✅ |
| TC-PER-014 | `a1`, `aB`, `ab` 정렬 | `a1`, `aB`, `ab`(대문자가 소문자보다 앞) | D-50 | ✅ |

## 리포지토리 — `packages/persistence/test/ticket.repository.int-spec.ts`

| ID | 시나리오 | 기대 결과 | 근거 | 상태 |
|----|----------|-----------|------|------|
| TC-PER-015 | 저장 후 `ticketId`로 조회 | 같은 값 | FR-01 | ✅ |
| TC-PER-016 | 저장 | ORM 훅이 생성·수정 시각을 채움 | D-50 | ✅ |
| TC-PER-017 | 없는 `ticketId` 조회 | `null` | FR-01 | ✅ |
| TC-PER-018 | 상태별 마지막 순서 키 | 마지막 키 반환, 빈 컬럼은 `null` | D-79 | ✅ |
| TC-PER-019 | 같은 (상태, 순서 키) 저장 | `PositionConflictError`로 변환 | D-49, D-84 | ✅ |
| TC-PER-020 | 충돌 뒤 다시 저장 | 정상 동작 | D-84 | ✅ |
| TC-PER-021 | 이어서 3건 저장 | 순서 키가 생성 순으로 증가 | D-79 | ✅ |
| TC-PER-022 | 조회 결과 | 내부 PK 없음 | 헌법 IV | ✅ |
| TC-PER-023 | 빈 저장소 전체 조회 | 빈 배열 | 002 FR-001 | ✅ |
| TC-PER-024 | 세 상태에 섞어 저장한 뒤 전체 조회 | 상태 순서(`TODO`→`IN_PROGRESS`→`DONE`), 같은 상태는 순서 키 오름차순 | 002 FR-001 | ✅ |
| TC-PER-025 | `ticketId`로 삭제 | `true`, 이후 조회 `null`, 다른 티켓은 그대로 | 002 FR-002 | ✅ |
| TC-PER-026 | 없는 `ticketId` 삭제 | `false` | 002 FR-002 | ✅ |
