# TRD 04. 계층 간 경계 규칙

계층 경계를 폴더가 아니라 **패키지 단위**로 나누고, 의존 방향을 `package.json`의 `dependencies`로 강제한다. 역방향 import는 컨벤션 위반이 아니라 빌드·설치 단계의 오류로 드러난다.

## 의존 방향 (백엔드)

```
domain  ←  application  ←  persistence
                        ←  bootstrap-http (persistence, application, domain 모두 조립)
```

- 화살표는 "의존한다"의 방향이다. 안쪽(domain)은 바깥을 절대 모른다.
- `persistence`는 `bootstrap-http`를 import하지 않는다. (순환 의존 금지)

## 패키지별 규칙

### domain

- 프레임워크 의존이 없다 (Nest, MikroORM 모두 금지).
- 엔티티와 값 객체를 둔다: `Ticket`, `Title`, `Priority`, `Position`.
- 티켓의 공개 식별자 `ticketId`를 여기서 생성한다 (UUID v4). DB 내부 PK는 도메인 모델에 없다.
- 상태 전이는 자유이므로 상태 관련 불변식은 없다.

### application

- 유스케이스(Inbound 포트)와 Repository 포트(Outbound 포트)를 둔다.
- Nest 데코레이터(`@Injectable()` 등)를 허용한다. 즉 `@nestjs/common`에 의존한다.
- 포트는 `interface` + Symbol 토큰으로 정의하고, 토큰 상수를 이 패키지가 export한다. TS의 `interface`는 컴파일 후 사라지므로 주입에는 토큰이 필요하다. Inbound·Outbound 모두 같은 방식이다.
- 웹 관련 의존성(`@nestjs/platform-express` 등)은 없다.

### persistence

- MikroORM 영속성 엔티티, 매퍼, 리포지토리 어댑터, **마이그레이션 파일**을 둔다.
- ORM(MikroORM), DB 드라이버, 마이그레이션 도구는 이 패키지의 `dependencies`다. 어댑터를 포트 토큰에 바인딩하는 Nest 모듈을 제공하므로 `@nestjs/common`에 의존한다. 웹 의존성(`@nestjs/platform-express` 등)은 없다.
- 영속성 엔티티는 도메인 모델과 별개 클래스이며 매퍼가 양방향으로 변환한다.
- 이 패키지 밖으로 MikroORM 타입을 노출하지 않는다. 밖에는 도메인 타입만 보인다.
- 우선순위 숫자 ↔ 문자열 변환은 매퍼에서 한다.
- DB 내부 PK는 영속성 엔티티에만 두고, 매퍼가 도메인의 `ticketId`와 대응시킨다. 조회는 `ticketId`로 한다.

### bootstrap-http

- **웹을 아는 유일한 곳**이다. 컨트롤러, DTO, Swagger 데코레이터, Nest 모듈 조립을 둔다.
- 다른 패키지의 Nest 모듈을 조립해 실행 가능한 앱을 만든다.
- 마이그레이션 CLI 설정과 실행 스크립트를 둔다. 설정은 `persistence`의 엔티티·마이그레이션 경로를 가리키기만 한다.
- 서버 기동 시 마이그레이터를 실행한다.

### api-client

- OpenAPI 스펙, 생성된 타입, openapi-fetch 래퍼를 둔다.
- 서버 패키지(`domain`, `application` 등)를 import하지 않는다. 계약의 소비자 쪽 패키지다.

## 프론트엔드 규칙

- `web`은 서버 패키지를 import하지 않고 `api-client`만 사용한다.
- FSD 레이어는 위에서 아래로만 참조한다 (일반적으로 `app` → `views` → `widgets` → `features` → `entities` → `shared`). 세부 규칙은 FSD 공식 문서로 확인한다.
- Next의 `app/`은 라우팅 껍데기로만 쓰고 화면 로직은 FSD 레이어에 둔다.
- `pages` 레이어는 `views`로 개명한다.
- `shared/api`가 `api-client`를 import해 baseUrl 설정과 클라이언트 인스턴스, 오류 응답 `code` 변환을 한곳에 둔다. 티켓별 쿼리·뮤테이션 훅(TanStack Query)은 `entities/ticket`에 둔다.

## 테스트 경계

- `domain`: 순수 단위 테스트 (프레임워크·DB 없음)
- `persistence`: 실제 Postgres(Testcontainers)로 통합 테스트
- `bootstrap-http`: API/컨트롤러 테스트로 전체 경로를 검증
- `application` 유스케이스 단위 테스트는 2차 범위다.

## 관련 문서

- 구성도: [01. 시스템 아키텍처](01-system-architecture.md)
- 데이터 흐름: [03. 데이터 흐름](03-data-flow.md)
