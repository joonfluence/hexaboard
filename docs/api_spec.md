# API 명세

REST API 명세다. 리소스 이름은 `tickets`(복수 명사)다. 서버 DTO에서 OpenAPI 스펙을 생성하는 것이 원칙이라, 이 문서는 **엔드포인트와 규칙**을 정하고 요청·응답 스키마 상세는 구현하며 OpenAPI로 확정한다.

> 카드 이동(`PUT /tickets/{ticketId}/position`)과 정렬(`POST /tickets/sort`)의 모델링은 확정했다. 표현 스키마 세부는 초안이며, 아직 정하지 않은 것은 "미정"으로 표시한다.

## 원칙

- **스타일**: REST, JSON
- **URI**: 복수 명사 리소스(`tickets`)를 쓰고 URI에 동사를 넣지 않는다. 동작은 HTTP 메서드로 표현한다.
- **계약의 진실 원천**: 서버. Nest DTO(class-validator) + `@nestjs/swagger`로 OpenAPI 스펙을 생성한다.
- **클라이언트**: 스펙에서 타입을 생성해 `packages/api-client`에 두고, 프론트는 openapi-fetch로 호출한다. 생성은 수동 명령이다.
- **웹 계층**: 컨트롤러와 DTO는 `apps/bootstrap-http`에만 있다. ([TRD 계층 간 경계 규칙](trd/04-layer-boundaries.md))
- **인증**: 없음 (단일 사용자). 공개 배포의 접근 통제 위험은 수용하고, 인증은 2차에 추가한다. ([NFR-04](non_functional_requirements.md))
- **CORS**: 브라우저가 서버를 직접 호출하므로 허용 오리진 설정이 필요하다.

- **버전**: URL 경로 버전을 쓴다. 아래 모든 경로 앞에 `/v1`이 붙는다 (예: `/v1/tickets`). 이 문서의 경로는 접두사를 생략해 적는다.

## 엔드포인트

| 메서드 | 경로 | 동작 | 성공 응답 | 관련 기능 |
|--------|------|------|-----------|-----------|
| `POST` | `/tickets` | 티켓 생성 | `201 Created` + 생성된 티켓 | FR-01, FR-02 |
| `GET` | `/tickets` | 티켓 목록 조회 (검색·필터) | `200 OK` | FR-01, FR-03, FR-08 |
| `GET` | `/tickets/{ticketId}` | 티켓 단건 조회 | `200 OK` | FR-01 |
| `PATCH` | `/tickets/{ticketId}` | 티켓 부분 수정 | `200 OK` + 수정된 티켓 | FR-01, FR-05, FR-06, FR-07 |
| `DELETE` | `/tickets/{ticketId}` | 티켓 삭제 | `204 No Content` | FR-01 |
| `PUT` | `/tickets/{ticketId}/position` | 카드 이동 (상태 변경 + 컬럼 안 순서) | `200 OK` + 이동된 티켓 | FR-02, FR-04 |
| `POST` | `/tickets/sort` | 정렬 실행 (순서 덮어쓰기) | `204 No Content` | FR-09 |

- `{ticketId}`는 티켓의 **공개 식별자**(별도 유니크 키, UUID v4)다. DB 내부 PK는 API에 노출하지 않는다. ([data_model.md](data_model.md#식별자-pk와-ticketid-분리))
- 태그는 티켓 표현 안의 이름 배열로 다루며 별도의 `tags` 리소스는 두지 않는다 (MVP).

## 규칙

### 생성과 수정

- 생성 입력: 제목(필수), 설명, 우선순위, 마감일, 태그. 생성 시 상태는 항상 `TODO`다.
- `PATCH`는 제목, 설명, 우선순위, 마감일, 태그만 받는다. **상태와 순서는 `PATCH`로 바꾸지 않고** `position` 하위 리소스로만 바꾼다.
- 제목이 비어 있는 등 검증에 실패하면 `400 Bad Request`를 돌려준다. 검증은 도메인의 Title 값 객체가 한다.
- 정의되지 않은 필드는 무시한다. 서버가 정하는 값은 아래 예외 규칙대로 거부한다.
- 없는 티켓이면 `404 Not Found`다.

### 목록 조회

- 상태별 컬럼 안에서 `position` 순으로 정렬해 돌려준다. 프론트는 `status`로 컬럼을 나눈다.
- 쿼리 파라미터 초안: `q`(검색어), `status`, `priority`, `tag`. 조합 규칙은 [FR-08](functional_requirements.md)이며 파라미터 이름·형식은 구현 시 OpenAPI로 확정한다.

### 카드 이동 (`PUT /tickets/{ticketId}/position`)

- 요청 본문: 대상 `status`, 기준 카드 `anchorTicketId`, 방향 `placement`(`BEFORE` / `AFTER`). 대상 컬럼이 비어 있으면 기준 카드는 생략한다 (초안).
- 클라이언트는 `position` 값을 보내지 않는다. 서버가 이웃 카드를 조회해 도메인의 `Position` 값 객체로 새 키를 계산하고 저장한다.
- 이동을 `POST .../move` 같은 동사가 아니라 티켓의 **위치라는 하위 리소스를 설정**하는 `PUT`으로 모델링했다. 같은 요청을 반복해도 결과가 같다.
- 기준 카드가 없으면 `404`다. 동시 이동으로 순서 키가 충돌하면 서버가 재계산해 재시도하고, 계속 실패하면 `409`를 돌려준다.

### 정렬 (`POST /tickets/sort`)

- 정렬은 컬렉션 전체에 대한 명령이라 하위 리소스로 모델링하기 어려워 컬렉션 액션으로 두었다.
- 요청 본문: 대상 컬럼 `status`, 정렬 기준 `sortBy`(`PRIORITY` / `DUE_AT`), 방향 `direction`(`ASC` / `DESC`).
- 실행하면 그 컬럼 안 카드의 `position`을 다시 계산해 저장한다. 마감일이 없는 티켓은 방향과 무관하게 맨 뒤에 둔다. 실행 취소는 제공하지 않는다.

### 우선순위

- 요청·응답에는 문자열 enum(`LOW` / `MEDIUM` / `HIGH` / `URGENT`)을 쓴다. 숫자 변환은 서버 내부 매퍼의 일이다.
- 생성 요청에 우선순위가 없으면 기본값 `MEDIUM`으로 저장한다.

### 시각

- 마감일 등 시각은 UTC 기준으로 주고받는 것을 원칙으로 한다.

## 예외 (클라이언트 요청 오류)

클라이언트가 잘못된 요청을 보냈을 때의 응답이다. 4xx만 다루며 서버 내부 오류(`500`)는 제외한다. 상태 코드와 오류 코드 이름은 확정이다. 검증 실패는 `422`가 아니라 `400`으로 통일한다.

### 공통

| 상황 | 상태 | 오류 코드 (초안) |
|------|------|------------------|
| 본문이 올바른 JSON이 아님 | `400` | `INVALID_REQUEST_BODY` |
| 필드 검증 실패 (필수 누락, 타입·형식 오류, enum 값 밖, 도메인 규칙 위반) | `400` | `VALIDATION_FAILED` |
| 경로의 `ticketId`가 UUID 형식이 아님 | `400` | `INVALID_TICKET_ID` |
| 존재하지 않는 티켓 | `404` | `TICKET_NOT_FOUND` |
| 존재하지 않는 경로 | `404` | (프레임워크 기본) |
| 허용되지 않는 메서드 | `405` | (프레임워크 기본) |
| `Content-Type`이 JSON이 아님 | `415` | `UNSUPPORTED_MEDIA_TYPE` (프레임워크 기본은 검사하지 않아 `500`이 되므로 가드로 구현) |

### 엔드포인트별

**`POST /tickets`**
- `title`이 없거나 `null`, 빈 문자열, 공백뿐임 → `400` `VALIDATION_FAILED` (도메인 Title 값 객체 규칙)
- `title` 또는 `description`이 길이 제한 초과 → `400` (제목 100자, 설명 2000자)
- `priority`가 `LOW` / `MEDIUM` / `HIGH` / `URGENT`가 아님 → `400`
- `dueAt`이 시각 형식(ISO 8601)이 아님 → `400`
- `tags`가 문자열 배열이 아니거나, 11개 이상이거나, 이름이 30자를 넘음 → `400`
- 같은 컬럼에 동시에 생성되어 순서 키가 충돌하고 서버 재시도(최대 3회) 후에도 실패 → `409` `POSITION_CONFLICT`
- 서버가 정하는 값(`ticketId`, `status`, `position`, `createdAt`, `updatedAt`)을 본문에 보냄 → `400` `VALIDATION_FAILED` (거부. 무시하지 않는다. 여러 개면 모두 `details`에 담는다)

**`GET /tickets`**
- `status` 또는 `priority` 쿼리 값이 enum에 없음 → `400` `VALIDATION_FAILED`

**`GET /tickets/{ticketId}`**
- UUID 형식이 아님 → `400` `INVALID_TICKET_ID`
- 없는 티켓 → `404` `TICKET_NOT_FOUND`

**`PATCH /tickets/{ticketId}`**
- 수정할 필드가 하나도 없는 빈 본문 → `400`
- `POST`와 같은 값 검증 실패 (제목, 우선순위, 마감일, 태그) → `400`
- `status`, `position`, `ticketId` 등 서버가 정하는 값을 보냄 → `400`. 상태와 순서는 `position` 하위 리소스로만 바꾼다.
- UUID 형식 오류 → `400`, 없는 티켓 → `404`

**`DELETE /tickets/{ticketId}`**
- UUID 형식 오류 → `400`
- 없는 티켓 → `404` (이미 삭제된 티켓도 같다)

**`PUT /tickets/{ticketId}/position`**
- `status`가 없거나 enum에 없음 → `400`
- `placement`가 없거나 `BEFORE` / `AFTER`가 아님 → `400`
- `anchorTicketId`가 UUID 형식이 아님 → `400`
- 대상 컬럼에 카드가 있는데 `anchorTicketId`가 없음 → `400` `INVALID_POSITION_TARGET`
- 기준 카드가 이동할 카드 자신임 → `400` `INVALID_POSITION_TARGET`
- 기준 카드가 대상 `status` 컬럼에 있지 않음 → `400` `INVALID_POSITION_TARGET`
- 이동할 카드가 없음 → `404` `TICKET_NOT_FOUND`
- 기준 카드가 없음 → `404` `ANCHOR_TICKET_NOT_FOUND`
- 처리 중 다른 요청으로 기준 카드가 옮겨지거나 삭제되어 위치를 정할 수 없음 → `409` `POSITION_CONFLICT` (서버 재시도 후에도 충돌할 때)

**`POST /tickets/sort`**
- `status`, `sortBy`, `direction`이 없거나 허용 값이 아님 → `400` `VALIDATION_FAILED`

### 오류 응답 형식

```json
{
  "statusCode": 400,
  "code": "VALIDATION_FAILED",
  "message": "요청 값이 올바르지 않습니다.",
  "details": [{ "field": "title", "reason": "빈 값일 수 없습니다." }]
}
```

- 프론트는 `message` 문구가 아니라 `code`로 분기한다. `details`는 검증 실패일 때만 필드별 사유를 담는다.
- 형식·타입 검증은 DTO(class-validator)가, 도메인 규칙(제목 등)은 `domain`의 값 객체가 맡고 둘 다 `400`으로 응답한다.
- `domain`은 프레임워크를 모르는 도메인 오류를 던지고, `bootstrap-http`가 이를 HTTP 상태와 오류 코드로 변환한다. ([TRD 계층 간 경계 규칙](trd/04-layer-boundaries.md))

## 표현 예시 (스키마는 OpenAPI로 확정)

```json
{
  "ticketId": "0194f0a6-...",
  "title": "문서 정리",
  "description": null,
  "status": "TODO",
  "priority": "MEDIUM",
  "dueAt": null,
  "tags": ["docs"],
  "createdAt": "2026-09-20T00:00:00Z",
  "updatedAt": "2026-09-20T00:00:00Z"
}
```

응답에는 내부 PK를 포함하지 않고 공개 식별자 `ticketId`만 둔다. 필드 이름은 camelCase로 두는 것을 초안으로 한다. 응답에 `position`은 노출하지 않는다. 순서는 목록 조회의 정렬 결과로만 드러난다.

## 목록 조회

- `GET /tickets`는 페이지네이션 없이 조건에 맞는 티켓을 모두 돌려준다. 보드가 세 컬럼을 한 번에 그리고, 드래그·낙관적 업데이트가 단순해진다.
- 태그 목록 조회 API는 두지 않는다. 태그 후보(자동완성, 필터 바)는 프론트가 받아 둔 티켓 목록에서 뽑는다.
- 필터는 쿼리 파라미터로 받는다. 서로 다른 종류의 조건은 AND, 검색어는 제목+설명 부분 일치, 태그 여러 개는 OR이다. ([FR-08](functional_requirements.md))

## 미정

- 요청·응답 스키마 상세
- 필터 파라미터의 이름·형식
