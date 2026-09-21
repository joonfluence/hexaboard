# TRD (기술 요구사항 문서)

제품을 어떻게 만들지를 다룬다. 무엇을 만드는지는 [PRD.md](PRD.md)를 본다. 문서가 길어지지 않도록 주제별로 나누어 두었다.

| 문서 | 내용 |
|------|------|
| [01. 시스템 아키텍처](trd/01-system-architecture.md) | 전체 구성, 모노레포 구조, 헥사고날 매핑 |
| [02. 기술 스택 상세](trd/02-tech-stack-detail.md) | 영역별 선택과 이유, 확인이 필요한 것 |
| [03. 데이터 흐름](trd/03-data-flow.md) | 조회, 카드 이동, 정렬, 계약 생성, 마이그레이션 흐름 |
| [04. 계층 간 경계 규칙](trd/04-layer-boundaries.md) | 패키지 의존 방향, 계층별 허용·금지 규칙 |
| [05. 개발환경 설정](trd/05-dev-environment.md) | 필요 도구, 환경변수, 스크립트 |
| [06. 배포 전략](trd/06-deployment.md) | 환경, 배포 트리거, CI, 마이그레이션 실행 |
| [07. 인프라 로드맵과 관측성](trd/07-infra-roadmap.md) | Phase 1 PaaS·이식 구조, 에러 추적·모니터링, Phase 2 IaC |

## 핵심 결정 요약

- Next.js(클라이언트 중심)와 NestJS를 분리한 풀스택 구조, 언어는 TypeScript로 통일
- 백엔드는 헥사고날. 계층 경계를 패키지 단위로 나누고 `package.json` 의존성으로 강제
- FE-BE 계약은 서버 DTO에서 OpenAPI를 생성해 공유
- 무료 플랫폼(Vercel, Render, Neon, GitHub Actions)에 `main` 브랜치 단일 환경으로 배포

## 관련 문서

- 기술 스택 요약: [tech_stack.md](tech_stack.md)
- 데이터·API: [data_model.md](data_model.md), [api_spec.md](api_spec.md)
- 미결 사항: [open_questions.md](open_questions.md)
