# Quickstart: 티켓 생성과 단건 조회 검증

구현이 끝났을 때 처음부터 끝까지 동작하는지 확인하는 절차다. 명령 이름은 [plan](plan.md)에서 확정한 Turborepo 태스크(`typecheck`/`lint`/`test`/`dev`, D-85)다. 케이스별 기대 응답은 [contracts/tickets-api.md](contracts/tickets-api.md)를 본다.

## 사전 준비

- Node.js: `.nvmrc`의 버전 (`nvm use`), pnpm, Docker 실행 중
- `.env.example`을 복사해 `.env`를 만들고 로컬 전용 값을 채운다 (`.env`는 커밋하지 않는다)
- 로컬 DB: `docker compose up -d`로 PostgreSQL 18 실행 (호스트 포트 `127.0.0.1:54320`, [TRD 05](../../docs/trd/05-dev-environment.md))
- `.env`: `DATABASE_HOST=127.0.0.1`, `DATABASE_PORT=54320`, `DATABASE_NAME`·`DATABASE_USER`·`DATABASE_PASSWORD`는 compose와 같은 로컬 값, `PORT`는 비어 있는 포트(이미 쓰는 포트는 피한다)

## 1. 품질 게이트

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

기대 결과: 모두 통과. `persistence` 통합 테스트와 API 테스트는 Testcontainers로 DB를 띄우므로 Docker가 필요하다.

## 2. 서버 기동

```bash
pnpm dev   # bootstrap-http
```

기대 결과: 기동 시 마이그레이션이 적용되고 서버가 뜬다. 마이그레이션이 실패하면 기동을 중단한다 (D-72).

## 3. 시나리오 (수동 확인)

1. 제목만으로 `POST /v1/tickets` → `201`, `status`=`TODO`, `priority`=`MEDIUM`, `ticketId` 확인 (C1)
2. 응답의 `ticketId`로 `GET /v1/tickets/{ticketId}` → `200`, 같은 값 (G1)
3. 응답에 내부 PK와 `position`이 없는지 확인 (SC-003)
4. 빈 제목으로 생성 → `400 VALIDATION_FAILED` (V1)
5. 없는 UUID로 조회 → `404 TICKET_NOT_FOUND` (G2), UUID가 아닌 값 → `400 INVALID_TICKET_ID` (G3)
6. 티켓을 두 개 만든 뒤 DB에서 같은 상태 컬럼의 순서 키가 생성 순으로 증가하는지 확인 (D-79)

## 완료 기준

- 위 게이트와 시나리오가 통과한다.
- 모든 태스크에 대해 테스트가 구현보다 먼저 작성되어 실패(Red)가 확인된 이력이 있다 (SC-004).
