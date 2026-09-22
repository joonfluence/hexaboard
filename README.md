# To-do-app

풀스택 개발 연습용 학습 프로젝트다. 티켓을 상태별 보드(Trello 참조)에서 관리하는 to-do 앱을 프론트엔드—백엔드 API—DB—배포까지 한 사이클로 직접 구현했다. 기능의 참신함보다 엔터프라이즈 수준 구조(헥사고날, FSD, 계층 경계 강제)를 연습하는 것이 목적이다.

- **웹**: https://todo-web-alpha-three.vercel.app
- **API**: https://todo-server-g3ud.onrender.com (무료 플랜, 유휴 후 첫 요청은 느릴 수 있음)
- **기획·설계 문서**: [docs/README.md](docs/README.md) — 진입점이자 문서 지도

## 기술 스택

TypeScript(FE/BE 통일) · Next.js(FSD) · NestJS(헥사고날) · MikroORM · PostgreSQL(Neon) · pnpm + Turborepo 모노레포. 배포는 Vercel(웹) · Render(서버), 관측성은 Grafana Cloud(OTel 로그·트레이스·메트릭, Faro). 상세는 [docs/tech_stack.md](docs/tech_stack.md).

## 개발 방법론: SDD + TDD

이 프로젝트는 [GitHub Spec Kit](https://github.com/github/spec-kit)으로 명세 주도 개발(SDD)을, 테스트 주도 개발(TDD)과 함께 진행했다.

- **정본은 `docs/`다.** 기획·요구사항·API 계약·데이터 모델이 먼저 문서로 확정되고, 기능별 명세(`specs/<번호>-<기능>/spec.md → plan.md → tasks.md`)는 `docs/`를 복제하지 않고 참조만 한다.
- **테스트가 구현보다 먼저다.** `docs/test_cases.md`에 테스트 케이스(TC)를 먼저 정의하고, tasks에서 테스트 태스크가 구현 태스크보다 항상 앞선다(Red → Green → Refactor). 원칙은 [`.specify/memory/constitution.md`](.specify/memory/constitution.md)에 명문화했다.
- **미결과 결정을 분리해서 추적한다.** 확정되지 않은 것은 [`docs/open_questions.md`](docs/open_questions.md)에 남기고 지어내지 않는다. 결정이 나면 근거와 함께 [`docs/decision_log.md`](docs/decision_log.md)(현재 107건)에 옮기고 [`docs/changelog.md`](docs/changelog.md)에 기록한다.

### 실제 결과 (2026-09-23 기준)

| 지표 | 값 |
|---|---|
| 전체 커밋 | 54개 |
| `fix:` 커밋 | 1개 (스펙 드리프트가 아닌 인프라 설정 이슈) |
| 결정 107건 중 구현 착수 후 번복 | 0건 |
| 테스트 | 388개 (도메인 108·영속성 49·설정 17·API 155·UI 59), 전부 구현 전 정의 |
| 첫 GitHub Actions CI 실행 | 9개 기능이 쌓인 상태에서 한 번에 전부 통과 |
| OpenAPI 계약 드리프트 | 구조적으로 차단(CI가 생성물 diff 검사) |

이 방식과 에이전틱 코딩의 관계, 왜 사람이 먼저 스펙을 검토하는 단계가 필요한지는 별도 글로 정리했다: [SDD+TDD가 에이전틱 코딩에 왜 필요한가](blog/sdd-tdd-agentic-coding.md).

## 개발환경

`docs/trd/05-dev-environment.md`를 따른다. 요약: Node(`.nvmrc`) · pnpm · Docker(Testcontainers) 필요.

```bash
pnpm install
pnpm dev          # 전체 워크스페이스
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
