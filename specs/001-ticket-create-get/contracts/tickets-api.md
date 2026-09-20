# Contract: 티켓 생성·조회 API (이 슬라이스)

정본은 [docs/api_spec.md](../../../docs/api_spec.md)다. 이 문서는 이 슬라이스의 **계약 테스트가 검증할 케이스 목록**이며 정본과 다르면 정본을 따른다. 오류 응답 형식(`statusCode`, `code`, `message`, `details`)은 정본을 본다. 모든 경로 앞에 `/v1`이 붙는다.

## POST /tickets

성공: `201 Created` + 티켓 표현 (정본의 "표현 예시"에서 `position`·`tags` 제외).

| # | 요청 | 상태 | code |
|---|------|------|------|
| C1 | 제목만 | 201 | - (`status`=`TODO`, `priority`=`MEDIUM`, 새 `ticketId`, 내부 PK 없음) |
| C2 | 제목·설명·우선순위·마감일 모두 | 201 | - (입력값 그대로) |
| C3 | 제목 앞뒤 공백 포함 | 201 | - (제거된 제목) |
| C4 | 설명이 `""` 또는 공백뿐 | 201 | - (`description`=`null`) |
| C5 | 제목 정확히 100자 / 설명 정확히 2000자 | 201 | - |
| C6 | 같은 내용 두 번 | 201 ×2 | - (서로 다른 `ticketId`) |
| C7 | 이름이 다른 미지 필드 포함 | 201 | - (무시) |
| V1 | 제목 없음 / `null` / `""` / 공백뿐 | 400 | `VALIDATION_FAILED` (`details`에 `title`) |
| V2 | 제목 101자 / 설명 2001자 | 400 | `VALIDATION_FAILED` |
| V3 | 우선순위가 허용 값 밖, `null` | 400 | `VALIDATION_FAILED` |
| V4 | `dueAt`이 ISO 8601 아님 | 400 | `VALIDATION_FAILED` |
| V5 | `ticketId` / `status` / `position` / `createdAt` / `updatedAt` 포함 | 400 | `VALIDATION_FAILED` |
| V6 | `tags` 포함 (이 슬라이스 한정) | 400 | `VALIDATION_FAILED` |
| V7 | 본문이 올바른 JSON이 아님 | 400 | `INVALID_REQUEST_BODY` |
| V8 | `Content-Type`이 JSON이 아님 | 415 | `UNSUPPORTED_MEDIA_TYPE` (프레임워크 동작은 구현 시 확인) |
| V9 | 동시 생성 충돌이 재시도 후에도 지속 | 409 | `POSITION_CONFLICT` (D-84) |

부가 검증: 새 티켓은 `TODO` 컬럼 맨 뒤에 놓인다 (D-79). 응답이 아니라 저장소 통합 테스트로 확인한다.

## GET /tickets/{ticketId}

성공: `200 OK` + 티켓 표현.

| # | 요청 | 상태 | code |
|---|------|------|------|
| G1 | 존재하는 `ticketId` | 200 | - (생성 시 값과 일치, 내부 PK 없음) |
| G2 | UUID 형식이나 없는 티켓 | 404 | `TICKET_NOT_FOUND` |
| G3 | UUID 형식이 아닌 값 | 400 | `INVALID_TICKET_ID` |

## 공통

- 존재하지 않는 경로 `404`, 허용되지 않는 메서드 `405`는 프레임워크 기본 응답이다.
- 어떤 응답에도 내부 PK와 `position`이 없어야 한다 (SC-003, D-80).
