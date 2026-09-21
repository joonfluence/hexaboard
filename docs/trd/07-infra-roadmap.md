# TRD 07. 인프라 로드맵과 관측성

배포를 두 단계로 나눈다. **Phase 1**은 PaaS로 먼저 배포하되 어디로든 옮길 수 있는 구조로 만든다. **Phase 2**는 같은 구조를 IaC로 관리하는 클라우드 컨테이너 환경으로 이식한다. 현재 배포 대상과 CI는 [06. 배포 전략](06-deployment.md)을 본다. Phase 1 서버 측 항목(컨테이너화·헬스체크·마이그레이션 분리·DB SSL·선언 파일)은 ✅, CI는 작성만 했고, 배포·관측성·Phase 2는 ⏳다.

## 원칙

- 배포 단위는 앱(`bootstrap-http`, `web`) 둘이고 `packages/*`는 앱에 실린다 ([TRD 06](06-deployment.md)).
- **이식성이 목표다.** 플랫폼(PaaS, 클라우드)을 바꿔도 이미지와 환경변수만 옮기면 되게 한다.
- 설정은 전부 환경변수, 상태는 앱에 두지 않는다(로컬 디스크·세션 없음).
- 손으로 만든 인프라를 남기지 않는다. Phase 1의 PaaS 설정도 저장소에 선언 파일과 환경변수 목록으로 남긴다.
- 추측한 단가·용량은 적지 않는다. 비용은 공식 계산기와 Infracost로 확인한다.

## Phase 1: PaaS 배포 + 이식 가능한 구조 (배포 제외 ✅)

| 작업 | 내용 |
|------|------|
| 서버 컨테이너화 ✅ | 멀티스테이지 `Dockerfile`(`pnpm deploy`로 서버에 필요한 파일만 담기), Node 버전은 `.nvmrc`와 일치 |
| 헬스체크·정상 종료 ✅ | `GET /health`(`/v1` 접두사 없음, DB를 조회하지 않아 유휴 DB를 깨우지 않는다), 종료 신호 처리(이미 `enableShutdownHooks` 사용 중) |
| 마이그레이션 분리 ✅ | 기본은 기동 시 자동 실행(D-72)이다. `MIGRATE_ON_START=false`로 끄고 `node dist/migrate.js`를 배포 전 단계로 실행할 수 있다(다중 인스턴스 경합 대비) |
| DB SSL 연결 ✅ | `DATABASE_SSL=true`로 SSL을 켠다 |
| 선언 파일 ✅ | `render.yaml` 등 플랫폼 선언 파일과 환경변수 목록 문서 |
| 웹 배포(Vercel) 설정 ✅ | [apps/web/vercel.json](../../apps/web/vercel.json). 프로젝트 Root Directory를 `apps/web`으로, "Include files outside root"를 켠다. `main` 외 브랜치는 `ignoreCommand`로 빌드를 건너뛴다. `NEXT_PUBLIC_API_BASE_URL`은 빌드 전에 Vercel 환경변수로 넣는다(서버 Render 주소). 서버 `CORS_ALLOWED_ORIGINS`에는 Vercel 프로덕션 도메인을 넣는다. Vercel 프로젝트 `todo-web`은 CLI로 만들었고 Root Directory 등은 설정했다. GitHub 저장소(`main`이 프로덕션 브랜치)도 연결했다. 남은 것은 `NEXT_PUBLIC_API_BASE_URL` 설정이다(서버 배포 후) |
| CI (워크플로 작성, GitHub Actions 실행 미확인) | GitHub Actions: PR에서 typecheck·lint·test·build, 이미지 빌드 확인, OpenAPI 어긋남은 기존 테스트가 잡음. Testcontainers가 Docker 부하에 민감하므로 동시성을 낮게 둔다 |
| 배포 | `main` 머지 시 자동 배포. 이미지에 커밋 SHA 태그를 남겨 롤백을 "이전 이미지"로 한다 |

## 관측성 (Phase 1에 함께, 프론트·백엔드 모두) ⏳

목표는 장애를 사용자보다 먼저 알고, 원인을 좁힐 수 있는 것이다. 벤더가 바뀌어도 코드를 다시 쓰지 않게 계측은 OpenTelemetry 표준을 기준으로 한다.

| 영역 | 내용 |
|------|------|
| 에러 추적 | 서버·웹 모두 예외를 수집하는 에러 추적 서비스(예: Sentry). 릴리스(커밋 SHA)와 소스맵을 연결해 배포별로 본다 |
| 로그 (서버 접근 로그·요청 ID ✅) | 서버는 요청마다 JSON 한 줄(`requestId`, `method`, `path`, `status`, `durationMs`)을 표준 출력에 쓰고 `X-Request-Id` 응답 헤더를 돌려준다. 안전한 `X-Request-Id` 요청 헤더는 이어받는다. 쿼리스트링·본문은 남기지 않는다. 앱 오류 로그는 아직 Nest 기본 형식이다. 수집·조회는 Grafana 계열(Loki 등)을 우선 검토 |
| 메트릭·대시보드 | 서버 요청 수·오류율·지연·DB 연결, 웹 Core Web Vitals. Grafana로 대시보드를 만든다 |
| 트레이스 | 서버 요청을 OpenTelemetry로 계측하고 프런트→백엔드 요청 ID를 잇는다(2차 후보) |
| 알림 | 가동 확인(uptime), 오류율, 지연에 알림. 1인 운영이므로 과하지 않게 |
| 웹 | 프론트 오류·성능은 브라우저 SDK로 수집한다. 개인정보(제목·설명 본문)는 전송하지 않도록 마스킹 |

구체 서비스·요금제 선택은 [open_questions.md](../open_questions.md#인프라)에 남긴다.

## Phase 2: IaC로 이식 ⏳

| 작업 | 내용 |
|------|------|
| IaC 도구 | Terraform 또는 OpenTofu, 원격 상태 저장소 |
| 계정·환경 | 스테이징/프로덕션을 계정(프로젝트) 단위로 분리 |
| 구성 | 네트워크, 컨테이너 서비스(Phase 1 이미지 그대로), 관리형 Postgres, 시크릿, 로그, 레지스트리 |
| 배포 | GitHub Actions에서 OIDC로 인증(장기 키 없음), 이미지 푸시 후 배포 |
| DB 마이그레이션 | 배포 전 단계(job)로 실행, 하위 호환 변경(확장 후 정리) 원칙 |
| 비용 | 공식 가격 계산기로 견적, Infracost로 PR에 변경 비용 표시, 예산 경보 |
| 관측성 이식 | Phase 1의 계측을 유지한 채 수집 대상만 옮긴다 |
| K8s·ArgoCD | 서비스가 늘어 GitOps가 필요해질 때까지 도입하지 않는다 |

## 관련 문서

- 배포 대상·CI·비밀값: [06. 배포 전략](06-deployment.md)
- 미결: [open_questions.md](../open_questions.md#인프라)
