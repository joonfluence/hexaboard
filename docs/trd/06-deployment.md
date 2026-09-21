# TRD 06. 배포 전략

무료 플랫폼에 단일 환경으로 배포한다. 플랫폼별 무료 조건은 자주 바뀌므로 2026-09-21에 공식 페이지로 확인했다. 구현 착수 때 다시 확인한다.

## 환경

- **단일 환경**(프로덕션)만 둔다. 스테이징 환경과 환경별 DB 분리는 없다.
- `main` 브랜치만 프로덕션에 자동 배포한다.
- `development` 브랜치는 CI 검증용 통합 브랜치다. 배포되지 않는다.

## 배포 대상

| 대상 | 플랫폼 | 상태 | 메모 |
|------|--------|------|------|
| 웹 (`apps/web`) | Vercel | 확정 | 프리뷰 배포는 끈다 (`main`만 배포) |
| 서버 (`apps/bootstrap-http`) | Render 무료 플랜 | 확정 | 15분 무트래픽이면 잠들고, 깨어나는 데 약 1분. 월 750 인스턴스 시간(워크스페이스 단위), 인스턴스 1개, 디스크 없음 |
| DB | Neon (Postgres) | 확정 | 5분 유휴 시 자동 중지(끌 수 없음), 프로젝트당 저장 0.5GB, 월 100 CU-hours, 전송 5GB. 만료·비활성 삭제 없음 |

## 실제 배포 구성 (2026-09-21)

| 대상 | 주소·리소스 | 메모 |
|------|-------------|------|
| 웹 | Vercel 프로젝트 `todo-web`, `todo-web-alpha-three.vercel.app` | GitHub 연결됨. `main` 푸시가 프로덕션 자동 배포를 일으킨다 |
| 서버 | Render 서비스 `todo-server`(싱가포르, 무료), `todo-server-g3ud.onrender.com` | 브랜치 `main`, Docker 런타임, 헬스체크 `/health` |
| DB | Neon 프로젝트 `todo-app`(싱가포르, PG 18) | 접속 정보는 Render 환경변수로만 둔다 |

- Render 자동 배포가 동작하지 않는다(푸시해도 새 배포가 생기지 않음). 저장소를 URL로 연결해 GitHub 앱 웹훅이 없는 것으로 추정한다. 당분간 `render deploys create <서비스ID> --commit <전체 SHA>`로 수동 배포한다.
- Render는 환경변수를 바꿔도 재배포하지 않으므로 값을 바꾼 뒤 수동 배포한다.
- 웹의 `NEXT_PUBLIC_API_BASE_URL`(Vercel 프로덕션 환경변수)은 서버 주소, 서버의 `CORS_ALLOWED_ORIGINS`는 웹 도메인이다.
- DB SSL은 `DATABASE_SSL=true`다. MikroORM v7은 `driverOptions`를 `pg` 풀에 그대로 넘기므로 `driverOptions.ssl`로 준다(`connection` 키를 쓰면 기동이 실패한다).

## 유휴 지연

- 서버는 15분, DB는 5분 유휴 후 잠든다. 오래 안 쓰다 접속하면 서버와 DB가 차례로 깨어나며 첫 로딩이 느리다. 이를 **허용**한다. ([NFR-01](../non_functional_requirements.md))

## CI

- **플랫폼**: GitHub Actions (저장소는 GitHub, 공개)
- **트리거**: `main`, `development` 브랜치로 올라가는 PR
- **동작**: 테스트 코드 자동 실행. Testcontainers로 테스트용 Postgres를 띄운다.
- CI와 자동화 테스트는 best-effort다. 미완이어도 MVP 완료로 인정한다.
- OpenAPI 어긋남은 PR에서 `generate`를 실행해 커밋된 결과와 diff가 나면 실패시키는 방식으로 검증한다. CI가 best-effort이므로 CI 구성 시점에 함께 넣는다.
- 공개 저장소에서 표준 GitHub 호스티드 러너는 무료다. 큰 러너는 유료이므로 쓰지 않는다.

## 마이그레이션 실행

- 서버 기동 시 `bootstrap-http`의 기동 코드가 MikroORM 마이그레이터를 실행한다. Render의 배포 전 실행(pre-deploy) 기능에는 의존하지 않는다.
- 위험: 마이그레이션이 실패하면 앱 기동이 실패해 배포가 죽을 수 있다. 무료 플랜은 유휴 후 재기동이 잦아 기동마다 확인 단계가 붙는다.
- 마이그레이션이 실패하면 서버는 기동을 중단하고 종료한다. 스키마는 자동으로 되돌리지 않으며, 마이그레이션을 고쳐 다시 배포하는 수동 복구를 원칙으로 한다. 실패한 새 배포가 이전 버전을 교체하지 않는지는 Render 문서로 확인한다.
- 미정: 다중 인스턴스 동시 기동 시 경합 (무료 플랜은 인스턴스 1개). 단일 프로덕션 DB라 되돌릴 환경이 없다.

## 비밀값

- DB 연결 문자열 등은 각 플랫폼의 환경변수·시크릿으로만 관리하고 저장소에 커밋하지 않는다.
- 브라우저가 서버를 직접 호출하므로 서버의 CORS 허용 오리진에 프로덕션 웹 도메인 하나만 등록한다. 프리뷰 배포를 끄므로 와일드카드는 쓰지 않는다.
- 인증이 없어 URL을 아는 누구나 접근할 수 있는 위험은 수용한다. 인증은 향후 고도화에서 추가한다. ([NFR-04](../non_functional_requirements.md))

## 롤백

- 문제가 생긴 배포는 해당 커밋을 `git revert`해 `main`에 올려 자동 배포로 되돌린다. 스키마가 바뀐 배포라면 마이그레이션까지 함께 고쳐 올린다. 플랫폼의 롤백 기능은 절차로 정하지 않는다.

## 이후 계획

- PaaS 배포를 이식 가능한 구조로 만들고 에러 추적·모니터링을 붙이는 Phase 1, 이를 IaC로 옮기는 Phase 2는 [07. 인프라 로드맵](07-infra-roadmap.md)을 본다.

## 관련 문서

- 개발환경: [05. 개발환경 설정](05-dev-environment.md)
- 미결 전체: [open_questions.md](../open_questions.md#인프라)
