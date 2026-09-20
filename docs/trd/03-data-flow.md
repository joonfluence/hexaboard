# TRD 03. 데이터 흐름

주요 흐름을 요청 경로 기준으로 정리한다. 요청·응답 스키마는 [api_spec.md](../api_spec.md)에서 구현 시 확정하므로 여기서는 계층 간 흐름만 다룬다.

## 기본 요청 경로

```
브라우저 (web)
  → openapi-fetch (api-client)
  → 컨트롤러 (bootstrap-http)         DTO → 유스케이스 입력으로 변환
  → 유스케이스 (application)          Inbound 포트 구현
  → Repository 포트 (application)     Outbound 포트
  → 어댑터 (persistence)              매퍼로 도메인 ↔ 영속성 엔티티 변환
  → MikroORM → Neon (Postgres)
```

- 도메인 모델은 `domain`에 있고 프레임워크를 모른다. 컨트롤러가 유스케이스를, 유스케이스가 포트를 호출하며 포트는 `interface` + Symbol 토큰으로 주입한다.

## 티켓 목록 조회

1. 보드 화면이 TanStack Query로 목록을 요청한다 (검색·필터 조건 포함).
2. 서버가 `persistence`에서 티켓을 `position` 순으로 조회해 도메인 객체로 변환한다.
3. 응답을 상태별 컬럼으로 나누어 렌더링한다.

## 카드 이동

1. 사용자가 카드를 드래그한다. 프론트가 낙관적 업데이트로 배열 순서를 먼저 바꾼다.
2. 프론트가 `PUT /tickets/{ticketId}/position`으로 이동 요청을 보낸다: 기준 카드, 앞/뒤 방향, 대상 상태. ([api_spec.md](../api_spec.md))
3. `application`이 outbound 포트로 이웃 카드의 순서 키를 조회한다.
4. `domain`의 `Position` 값 객체가 두 이웃 키 사이의 새 키를 계산한다.
5. `persistence`가 카드 한 건의 `position`(과 상태)을 갱신한다.
6. 응답으로 성공 여부를 돌려준다. 실패 시 프론트는 이전 상태로 롤백하고 서버 상태로 재조회한다. ([FR-04](../functional_requirements.md))

- 순서 키는 같은 컬럼 안에서만 비교하므로, 컬럼 간 이동 시 대상 컬럼의 이웃 카드가 기준이다.
- 동시 이동으로 (상태, 순서 키) 유니크 제약이 깨지면 `persistence`가 충돌을 알리고, `application`이 이웃을 다시 조회해 재계산·재시도한다. 계속 실패하면 `409`다.
- 재시도는 최초 시도 후 최대 3번이다.

## 정렬 실행

1. 사용자가 정렬 기준을 골라 실행한다.
2. 서버가 기준에 맞게 카드를 정렬한 뒤 `position`을 다시 계산해 저장한다 (수동 순서를 덮어씀).
3. 프론트가 목록을 다시 조회한다.

- 정렬은 컬럼 단위이며 필터가 켜진 동안에는 비활성화한다. 기준과 undo 여부는 [FR-09](../functional_requirements.md#fr-09-정렬)를 본다.

## API 계약 생성

```
Nest DTO + swagger 데코레이터 (bootstrap-http)
  → OpenAPI 스펙 생성
  → 클라이언트 타입 생성 (api-client)
  → 생성물을 커밋
  → web이 api-client를 통해 호출
```

- 생성은 수동 명령이다. 서버 DTO를 바꾸고 명령을 잊으면 어긋난다. 이를 CI에서 생성 후 diff 검사로 잡는다. ([06. 배포 전략](06-deployment.md))

## 마이그레이션

1. 서버가 기동될 때 `bootstrap-http`의 기동 코드가 MikroORM 마이그레이터를 실행한다.
2. 마이그레이션 파일과 엔티티는 `persistence`에 있고, 설정은 `bootstrap-http`가 가리키는 방식이다.
3. Render 무료 플랜은 유휴 후 재기동이 잦으므로 기동마다 "이미 적용됨"을 확인하는 단계가 붙는다.

- 마이그레이션이 실패하면 기동을 중단한다. ([TRD 배포 전략](06-deployment.md))

## 관련 문서

- 경계 규칙: [04. 계층 간 경계 규칙](04-layer-boundaries.md)
- 데이터 규칙: [data_model.md](../data_model.md)
