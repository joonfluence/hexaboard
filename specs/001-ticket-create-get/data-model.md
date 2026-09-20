# Data Model: 티켓 생성과 단건 조회

정본은 [docs/data_model.md](../../docs/data_model.md)다. 이 문서는 이 슬라이스가 다루는 범위만 밝히고 내용은 복제하지 않는다.

## 이 슬라이스가 만드는 것

- **테이블 `ticket`** 하나와 첫 마이그레이션. 컬럼은 정본의 `ticket` 표를 그대로 따른다 (`id`, `public_id`, `title`, `description`, `status`, `priority`, `due_at`, `position`, `created_at`, `updated_at`).
- 제약: `public_id` 유니크, `status` CHECK, (`status`, `position`) 유니크, `position`은 `COLLATE "C"`.

## 이 슬라이스가 만들지 않는 것

- `tag`, `ticket_tag` 테이블: 태그는 범위 밖이다 (다음 기능).
- 카드 이동·정렬을 위한 로직: `Position`은 "컬럼 첫 카드"와 "마지막 키 뒤" 계산만 만든다.

## 도메인 모델 (프레임워크 없음)

| 개념 | 규칙 (출처) |
|------|-------------|
| `Ticket` | 공개 식별자 `ticketId`(UUID v4)를 `create()`에서 만든다. 상태는 `TODO`. 내부 PK를 모른다. ([TRD 04](../../docs/trd/04-layer-boundaries.md)) |
| `Title` | 앞뒤 공백 제거 후 비어 있지 않고 100자 이하 (spec FR-004, D-81) |
| 설명 | 공백뿐이면 `null`, 2000자 이하 (spec FR-001, D-81) |
| `Priority` | `LOW`/`MEDIUM`/`HIGH`/`URGENT`, 생략 시 `MEDIUM` ([FR-06](../../docs/functional_requirements.md)) |
| `Position` | 사전순 순서 키. 이번 범위: 첫 카드 키, 마지막 키 뒤의 키 |

## 영속성 매핑

- 영속성 엔티티는 도메인 모델과 별개 클래스이고 매퍼가 변환한다. 우선순위 숫자↔문자열과 `ticketId`↔`public_id` 대응은 매퍼가 맡는다. 내부 PK는 `persistence` 밖으로 나가지 않는다.
- 우선순위의 정확한 숫자 값은 구현 시 확정한다 ([research.md](research.md)).
