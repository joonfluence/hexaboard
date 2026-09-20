# To-do-app

풀스택 학습용 to-do 앱이다. 티켓을 상태별 보드(Trello 참조)에서 관리한다. 기획·설계 문서는 `docs/`에 있고, 아직 코드는 없다.

## 문서

- 진입점은 `docs/README.md`다. 문서 지도와 "작업별 읽을 문서" 표가 있다.
- 필요한 문서만 읽는다. `docs/decision_log.md`(결정 이유)와 `docs/changelog.md`(변경 이력)는 필요할 때만 읽는다.

## 규칙

- **확정되지 않은 것은 지어내지 않는다.** `docs/open_questions.md`에 있는 항목은 구현 전에 사용자에게 묻는다.
- 결정이 생기면 해당 주제 문서를 갱신하고, `open_questions.md`에서 지우고, `decision_log.md`에 근거와 함께 추가하고, `changelog.md`에 기록한다.
- 문서 한 개는 200줄을 넘기지 않는다. 넘으면 하위 문서로 쪼갠다.
- 같은 내용을 여러 문서에 복제하지 않고 링크로 참조한다.
- 도메인 용어는 "티켓"이다 ("할 일"이 아님).
- 저장소가 공개(public)이므로 비밀값(DB 연결 문자열 등)은 절대 커밋하지 않는다.

## 지켜야 할 구조 (상세는 `docs/trd/04-layer-boundaries.md`)

- 계획된 모노레포: `apps/web`(Next.js, FSD), `apps/bootstrap-http`(NestJS), `packages/{domain, application, persistence, api-client}`. pnpm + Turborepo.
- 헥사고날이며 계층 경계는 패키지 `dependencies`로 강제한다. 의존 방향은 `domain ← application ← persistence / bootstrap-http`다.
- `domain`은 프레임워크를 모른다. 웹 계층(컨트롤러, DTO)은 `bootstrap-http`에만 둔다. `persistence`는 `bootstrap-http`를 import하지 않는다.
- 티켓의 공개 식별자 `ticketId`(UUID v4)는 DB 내부 PK와 별개다. 내부 PK는 API와 도메인에 노출하지 않는다.
- 카드 이동은 클라이언트가 계산한 순서 값이 아니라 "기준 카드의 앞/뒤"로 요청하고, 서버의 `Position` 값 객체가 순서 키를 계산한다.
