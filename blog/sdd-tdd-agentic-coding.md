# SDD + TDD가 에이전틱 코딩에 왜 필요한가 — to-do 앱 하나 완성하며 겪은 것들

학습용 to-do 앱 하나를 Claude Code로 처음부터 끝까지(기획 → 설계 → 구현 → 배포 → 관측성까지) 만들었다. 다른 점이 하나 있었다면, 이번엔 코드부터 짜지 않고 **SDD(Spec-Driven Development)와 TDD를 처음부터 강제**했다는 것이다. 결과만 먼저 말하면: 전체 54커밋 중 버그 수정 커밋이 1개, 107개의 설계 결정 중 구현 착수 후 뒤집힌 게 0개, 테스트 388개가 전부 구현 전에 먼저 정의됐고, 여러 기능이 쌓인 뒤 처음 돌린 CI가 한 번에 통과했다.

이 글은 그 과정에서 "왜 이게 일반적인 개발보다 에이전틱 코딩에서 더 중요한가"를 정리한 것이다. 전체 코드와 문서는 공개 저장소 [github.com/joonfluence/to-do-app](https://github.com/joonfluence/to-do-app)에 있고, 이 글에서 인용한 부분은 전부 실제 파일로 링크를 걸어뒀다(커밋 [`a4bf691`](https://github.com/joonfluence/to-do-app/tree/a4bf691) 기준 — 이후 갱신되면 줄 번호가 밀릴 수 있다).

## SDD와 TDD, 짧게

**SDD(Spec-Driven Development)**는 코드보다 명세(spec)를 먼저 쓰고, 그 명세를 정본(canonical source)으로 삼는 방식이다. 나는 [GitHub Spec Kit](https://github.com/github/spec-kit)을 썼다. 기능 하나마다 `spec.md`(무엇을·왜) → `plan.md`(어떻게) → `tasks.md`(순서)를 만들고, 그 위에 `docs/`라는 더 큰 정본을 하나 더 뒀다 — PRD, 요구사항, API 명세, 데이터 모델, 그리고 **아직 정하지 않은 것만 모아둔 `open_questions.md`**와 **정한 것과 이유를 적은 `decision_log.md`**.

**TDD**는 다들 아는 그것이다. Red(실패하는 테스트) → Green(통과시키는 최소 구현) → Refactor.

둘 다 새로운 개념은 아니다. 내가 겪은 건 "이걸 사람이 아니라 AI 에이전트가 주로 코드를 쓰는 상황에 적용하면 실제로 어떤 산출물과 절차가 나오는가"였다. 아래는 그 실제 절차다.

## SDD: Spec Kit 6단계로 실제로 어떻게 했나

Spec Kit은 슬래시 커맨드 6개가 파이프라인을 이룬다. [`.specify/workflows/speckit/workflow.yml`](https://github.com/joonfluence/to-do-app/blob/a4bf691/.specify/workflows/speckit/workflow.yml)에 단계와 리뷰 게이트가 선언돼 있다.

```
/speckit.specify → [사람 승인] → /speckit.plan → [사람 승인] → /speckit.tasks → /speckit.implement
```

**1) `/speckit.constitution` — 원칙을 헌법 파일 하나에 못박는다 (프로젝트 시작 시 1회)**

[`.specify/memory/constitution.md`](https://github.com/joonfluence/to-do-app/blob/a4bf691/.specify/memory/constitution.md)에 "테스트 먼저(NON-NEGOTIABLE)", "계층 경계는 패키지로 강제", "확정 안 된 건 지어내지 않는다" 같은 7개 원칙을 적었다. 이후 모든 spec·plan·tasks는 이 파일을 참조한다. 구현하다 새 원칙이 필요해지면(예: "TypeScript strict 모드 필수·`any` 금지") 헌법을 v1.0.0 → v1.1.0 → v1.2.0으로 올렸다 — 코드가 아니라 헌법을 먼저 고치는 것도 원칙 중 하나다.

**2) `/speckit.specify` — 기능 하나당 `spec.md`를 만든다**

"무엇을·왜"만 쓰고 "어떻게"는 안 쓴다. User Story, 범위(포함/제외), 그리고 **`## Clarifications`**라는 섹션이 자동으로 생긴다. 001 기능(티켓 생성·조회)의 [실제 spec.md](https://github.com/joonfluence/to-do-app/blob/a4bf691/specs/001-ticket-create-get/spec.md#L22-L26)에 이렇게 남아있다:

> ### Session 2026-09-21
> - Q: 제목 앞뒤 공백은 어떻게 저장하는가? → A: 앞뒤 공백을 제거해 저장한다. 길이 100자 검사도 제거 후 기준이다.
> - Q: 설명을 빈 문자열이나 공백뿐으로 보내면? → A: "설명 없음"(`null`)으로 저장한다. 생략·`null`·빈 문자열·공백뿐이 모두 같은 상태다.
> - Q: 범위 밖 필드(예: `tags`)가 생성 요청에 있으면? → A: `tags`만 `400`으로 거부하고, 이름이 전혀 다른 미지 필드는 무시한다.

이게 `/speckit.clarify`가 하는 일이다 — spec을 다시 읽고 애매한 지점을 최대 5개 질문으로 좁혀서 답을 spec 안에 그대로 인코딩한다. 질문에 이미 `docs/decision_log.md`에 있는 답이면 거기서 끌어오고, 없으면 나한테 되물었다.

**3) `/speckit.plan` — "어떻게"를 쓰고, 헌법 위반 여부를 표로 판정한다**

`plan.md`에는 매번 **Constitution Check**라는 표가 들어간다. 같은 001 기능의 [실제 plan.md](https://github.com/joonfluence/to-do-app/blob/a4bf691/specs/001-ticket-create-get/plan.md#L39-L49)에서 발췌:

| 원칙 | 판정 | 근거 |
|---|---|---|
| III. 테스트 먼저 | 통과 | 모든 Phase가 "Red 확인 → Green → Refactor" 순서다 |
| IV. 핵심 불변식 | 통과 | `ticketId`(UUID v4)는 도메인이 생성, 내부 PK는 응답에 노출 안 함 |
| V. 단순함과 범위 절제 | 통과 | 이동용 로직·태그·목록·수정·삭제는 이번 범위에서 만들지 않는다 |

**위반이 있으면 그냥 못 넘어간다.** "Complexity Tracking" 섹션에 왜 이 위반이 불가피한지 정당화를 적어야 다음 단계(tasks)로 갈 수 있다. plan을 다 쓴 뒤 한 번 더 재확인하는 게이트도 있다(설계하다 보면 처음엔 안 보이던 위반이 나중에 보이기 때문).

**4) `/speckit.tasks` — plan을 실행 순서가 있는 태스크 목록으로 쪼갠다**

여기서 태스크가 계층 순서(domain → persistence → API)로, 그리고 테스트-구현 쌍으로 나열된다. 이건 다음 섹션(TDD 파트)에서 자세히 본다.

**5) `/speckit.implement` — tasks를 순서대로 실행한다**

**6) `/speckit.analyze` (선택) — spec·plan·tasks 세 문서가 서로 어긋나지 않는지 교차 검사한다**

각 단계 사이에 사람이 승인/거부하는 게이트가 있다(`workflow.yml`의 `type: gate`). 거부하면 그 단계에서 멈춘다 — 에이전트가 다음 단계로 알아서 넘어가지 않는다.

## TDD를 SDD 안에 강제로 끼워 넣은 방법

여기서 짚고 싶은 게 하나 있다. **Spec Kit 기본 템플릿은 테스트를 선택 사항으로 둔다.** [`.specify/templates/tasks-template.md` 원문](https://github.com/joonfluence/to-do-app/blob/a4bf691/.specify/templates/tasks-template.md#L12):

> Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

그대로 쓰면 에이전트가 "이번엔 테스트 없이 빨리 갈게요"를 기본값으로 고를 수 있다는 뜻이다. 이걸 뒤집은 게 [헌법 원칙 III](https://github.com/joonfluence/to-do-app/blob/a4bf691/.specify/memory/constitution.md#L27)다:

> 모든 프로덕션 코드는 실패하는 테스트를 먼저 작성한 뒤에 구현한다. Red → Green → Refactor 순서를 지킨다. (...) 테스트를 통과시키려고 테스트를 약화하거나 삭제하지 않는다.

`/speckit.tasks`는 태스크를 짤 때 헌법을 먼저 읽기 때문에, 템플릿의 "OPTIONAL"이 아니라 헌법의 "NON-NEGOTIABLE"이 이긴다. 004(카드 이동) 기능의 [실제 `tasks.md`](https://github.com/joonfluence/to-do-app/blob/a4bf691/specs/004-ticket-move/tasks.md#L3-L10)를 그대로 옮기면:

```
- [X] T001 TC 정의: TC-DOM-047~056, TC-PER-030~034, TC-API-052~070을 ⏳로 추가
- [X] T002 RED: Position.between, 확장된 Position.from, Ticket.moveTo 테스트
- [X] T003 GREEN: 도메인 구현
- [X] T004 RED: 저장소 findAdjacentPosition·hasTicketsInStatus·move 통합 테스트
- [X] T005 GREEN: 포트와 MikroOrmTicketRepository 구현
- [X] T006 RED: API 테스트 tickets.move*.api-spec.ts
- [X] T007 GREEN: MoveTicket, 오류 2종, MovePositionDto, 컨트롤러 PUT, 필터 매핑
- [X] T008 문서: D-95, open_questions 해소, changelog, TC ✅, tdd-log
```

RED와 GREEN이 계층마다(도메인 → persistence → API) 한 번씩, 총 3세트로 반복된다. 그리고 기능마다 `tdd-log.md`라는 파일을 따로 둬서 RED에서 실제로 몇 개가 실패했는지 숫자로 남겼다. 같은 기능의 [실제 기록](https://github.com/joonfluence/to-do-app/blob/a4bf691/specs/004-ticket-move/tdd-log.md):

```
## RED (2026-09-21)
- 도메인: Position.between·Ticket.moveTo 없음으로 TC-DOM-047~056 19건 실패(기존 74건 통과)
- persistence: 포트 메서드 없음으로 TC-PER-030~034 5건 실패(기존 32건 통과)
- API: tickets.move* 27건 중 25건 실패(PUT 라우트 없음)

## GREEN
- 도메인: Position을 fractional indexing으로 재작성 (...)
## 게이트 (2026-09-21)
- domain 93, persistence 37, bootstrap-http 124 통과. typecheck·lint·build·prettier 통과.
- 테스트 결함 1건: TC-PER-031이 uuid 컬럼에 'x-none'을 넣어 실패 → 유효한 UUID로 수정(구현 결함 아님)
```

마지막 줄이 재미있는데, **실패한 게 구현이 아니라 테스트 자체였던 적도 있다.** TDD가 "테스트만 맞으면 안전하다"는 뜻은 아니다 — 다만 실패가 RED 단계에서, 숫자로, 즉시 드러난다는 게 핵심이다. 숫자가 안 맞으면(기대한 개수만큼 안 깨지면) 그 자리에서 걸린다.

### 계층마다 TDD가 실제로 달랐다: 백엔드 3계층 vs 프론트 2계층

**백엔드는 계층마다 테스트 방식 자체가 다르다.** 헌법이 계층별로 범위를 못박아뒀다.

- **domain — 순수 단위 테스트.** 프레임워크·DB 전혀 없이 함수만 테스트한다. ([description.spec.ts](https://github.com/joonfluence/to-do-app/blob/a4bf691/packages/domain/test/description.spec.ts#L23-L27))
  ```ts
  it('2001자는 거부한다 (V2)', () => {
    expect(() => normalizeDescription('가'.repeat(2001))).toThrow(
      InvalidDescriptionError,
    );
  });
  ```
- **persistence — Testcontainers로 띄운 진짜 Postgres.** Mock ORM이 아니라 실제 DB에 실제 마이그레이션을 적용하고 붙는다. 동시성 충돌(같은 컬럼에 순서 키가 겹치는 유니크 제약 위반) 같은 건 진짜 DB가 아니면 애초에 검증할 방법이 없다. ([helpers/postgres.ts](https://github.com/joonfluence/to-do-app/blob/a4bf691/packages/persistence/test/helpers/postgres.ts#L20-L46))
  ```ts
  export const POSTGRES_IMAGE = 'postgres:18'; // 로컬 compose와 같은 메이저 버전

  export async function startTestDatabase(): Promise<TestDatabase> {
    const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
    const orm = await MikroORM.init(
      createOrmConfig({
        host: container.getHost(),
        port: container.getPort(),
        dbName: container.getDatabase(),
        user: container.getUsername(),
        password: container.getPassword(),
      }),
    );
    // ...마이그레이션 적용 후 { container, orm, reset, stop } 반환
  }
  ```
- **API — 진짜 Nest 앱을 통째로 띄우고 HTTP로 때린다.** 컨트롤러만 단위 테스트하지 않고, DTO 검증부터 도메인 규칙, DB 저장까지 실제 요청·응답으로 확인한다. ([tickets.create.api-spec.ts](https://github.com/joonfluence/to-do-app/blob/a4bf691/apps/bootstrap-http/test/tickets.create.api-spec.ts#L17-L31))
  ```ts
  it('C1: 제목만 주면 201, TODO, MEDIUM, 새 ticketId를 돌려준다', async () => {
    const response = await postTicket(t.baseUrl, { title: '문서 정리' });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.ticketId).toMatch(UUID_V4);
    expect(body).toMatchObject({
      title: '문서 정리',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueAt: null,
    });
    expect(Date.parse(body.createdAt)).not.toBeNaN();
    expect(Date.parse(body.updatedAt)).not.toBeNaN();
  });
  ```

**프론트는 계층이 다르다 — E2E가 아예 없다.** dnd-kit 드래그를 jsdom에서 실제 포인터 이벤트로 재현하는 게 불안정해서(헌법 문서에 이 판단 근거가 남아있다), 대신 두 조각으로 쪼갰다.

- **순수 함수 테스트.** 드래그 결과(어느 카드를, 어디에 놓았는지)를 "요청 바디"로 바꾸는 로직(`planMove`)을 UI와 완전히 분리해서 함수로 뽑고, 그 함수만 순수 단위 테스트한다. ([plan-move.test.ts](https://github.com/joonfluence/to-do-app/blob/a4bf691/apps/web/test/plan-move.test.ts#L19-L27))
  ```ts
  it('TC-UI-027: 다른 컬럼 본문에 놓으면 그 컬럼의 상태로 요청한다', () => {
    const plan = planMove(board(), 'a', columnDroppableId('IN_PROGRESS'));
    expect(plan?.request).toEqual({
      status: 'IN_PROGRESS', anchorTicketId: 'd', placement: 'AFTER',
    });
  });
  ```
- **컴포넌트 테스트 + 가짜 네트워크 레이어.** 실제 서버 대신 `fetch`를 가로채는 [`createFakeServer()`](https://github.com/joonfluence/to-do-app/blob/a4bf691/apps/web/test/helpers/fake-server.ts)를 만들어 API 계약(`docs/api_spec.md`)을 흉내 낸다. 여기서 낙관적 업데이트(응답 오기 전에 화면을 먼저 바꾸는 것)를 테스트하는 게 까다로웠는데, 응답을 일부러 붙잡아두는 `gate()` 헬퍼로 해결했다. ([move-ticket.test.tsx](https://github.com/joonfluence/to-do-app/blob/a4bf691/apps/web/test/move-ticket.test.tsx#L47-L66))
  ```ts
  it('TC-UI-030: 응답을 기다리지 않고 배열 순서를 먼저 바꾸며, 성공하면 다시 조회하지 않는다', async () => {
    const held = gate();
    server.override('PUT', PUT, async (call) => {
      await held.opened; // 내가 release()할 때까지 응답 안 보냄
      return Response.json(aTicket('a', 'TODO', { title: String(call.path) }));
    });
    renderWithApp(<Harness activeId="a" overId="c" />, server);
    await screen.findByText('TODO:a');

    await user.click(screen.getByRole('button', { name: '이동' }));

    // 서버는 아직 응답 안 했는데 화면 순서가 벌써 바뀌어 있어야 한다
    await waitFor(() => expect(order()).toEqual(['TODO:b', 'TODO:c', 'TODO:a']));
    await act(async () => held.release()); // 이제 응답 보냄
    await waitFor(() => expect(server.callsTo('PUT', PUT)).toHaveLength(1));
    expect(server.callsTo('GET', LIST)).toHaveLength(1); // 성공하면 재조회하지 않는다
  });
  ```
  실패(409) 케이스는 원위치 롤백·토스트 노출·자동 재시도 없음까지 각각 별도 테스트로 검증한다. 이 패턴을 지원하는 실제 구현([`use-move-ticket.ts`](https://github.com/joonfluence/to-do-app/blob/a4bf691/apps/web/src/features/move-ticket/model/use-move-ticket.ts))은 TanStack Query의 `onMutate`·`onError`·`onSuccess` 세 갈래로 67줄이다 — 테스트가 먼저 이 세 갈래를 요구했기 때문에 구현이 이 모양으로 수렴했다:
  ```ts
  const mutation = useMutation({
    mutationFn: (plan: MovePlan) =>
      unwrap(client.PUT('/v1/tickets/{ticketId}/position', {
        params: { path: { ticketId: plan.ticketId } },
        body: plan.request,
      })),
    onMutate: async (plan) => {
      // 응답을 기다리지 않고 먼저 바꾼다(낙관적 업데이트). 롤백을 위해 이전 값을 스냅샷.
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      const previous = queryClient.getQueryData<Ticket[]>(listKey);
      queryClient.setQueryData(listKey, flattenBoard(plan.board));
      return { previous };
    },
    onError: (_error, _plan, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
      toast.show(MOVE_FAILED_MESSAGE);
      void queryClient.invalidateQueries({ queryKey: ticketKeys.all }); // 서버 상태로 재조회
    },
    onSuccess: (moved) => {
      queryClient.setQueryData<Ticket[]>(listKey, (list) =>
        list?.map((t) => (t.ticketId === moved.ticketId ? moved : t)),
      );
    },
  });
  ```

## 왜 에이전틱 코딩에서 더 절실한가

### 1. 에이전트는 기억을 잃는다 — 그리고 그건 버그가 아니라 기본값이다

세션이 끊기고 다시 열면 에이전트는 이전 대화를 모른다. 이번 프로젝트에서 실제로 겪었다. 관측성 작업을 하던 세션이 중간에 끊겼고, 다음 세션은 체크포인트 요약 몇 줄("OTEL 환경변수 어떻게 확인하냐고 물었었다" 수준)만 들고 시작했다. 그런데도 작업을 이어갈 수 있었던 건, 그 요약이 아니라 **`docs/`가 여전히 거기 있었기 때문**이다. `open_questions.md`를 보면 뭐가 안 끝났는지 알 수 있고, `decision_log.md`를 보면 왜 그렇게 정했는지 알 수 있다.

사람 개발자도 한 달 전 코드를 까먹지만, 그래도 "그때 왜 이렇게 짰지"라는 감각은 어렴풋이 남는다. 에이전트에게는 그 감각이 아예 없다. 매번 완전히 새로 태어난다. 그래서 **정본 문서가 없으면 매 세션이 고고학**이 된다 — 코드를 읽으며 의도를 추측해야 한다. 문서가 있으면 그냥 읽으면 된다.

### 2. 에이전트는 빈칸을 그럴듯하게 채운다

"확정되지 않은 것은 지어내지 않는다"는 원칙을 프로젝트 규칙([`CLAUDE.md`](https://github.com/joonfluence/to-do-app/blob/a4bf691/CLAUDE.md))과 Spec Kit 헌법(`.specify/memory/constitution.md`) 양쪽에 박아뒀다. 이게 없으면 무슨 일이 생기냐면 — 에이전트가 스펙에 없는 부분을 만나도 멈추지 않는다. 가장 그럴듯한 값을 골라서 계속 진행한다. 대부분은 맞지만, 가끔 틀리고, 그 틀림은 리뷰에서 "코드가 이상해 보이지 않기 때문에" 잘 안 걸린다.

[`open_questions.md`](https://github.com/joonfluence/to-do-app/blob/a4bf691/docs/open_questions.md)를 강제하면 이게 뒤집힌다. 스펙에 없는 걸 만나면 에이전트가 사용자에게 묻는다(이 프로젝트에서 실제로 카드 이동 규칙, 태그 정규화, 필터 조합 방식 같은 걸 여러 번 물었다). 질문이 늘어나는 게 처음엔 귀찮았지만, 그 질문들이 전부 [`decision_log.md`](https://github.com/joonfluence/to-do-app/blob/a4bf691/docs/decision_log.md)(현재 107건)에 근거와 함께 남았고, 나중에 같은 질문을 다시 하지 않았다.

### 3. 여러 에이전트가 같은 저장소를 동시에 건드릴 수 있다

이건 이번에 제일 크게 체감한 부분이다. 이 프로젝트를 진행하던 중, 다른 세션이 이미 `development` 브랜치에 소스맵 업로드·트레이스 전파 기능을 만들어둔 걸 모르고 새 세션에서 똑같은 기능을 다시 만들었다. `main`과 `development`가 갈라진 상태로 각자 비슷한 커밋을 쌓고 있었던 것이다. 게다가 그 사이 **또 다른 세션이 실시간으로 DI 토큰 리팩터링을 진행 중**이어서, 작업 트리에 내가 만들지 않은 커밋 안 된 변경사항이 섞여 있었다.

이 상황에서 진짜 도움이 된 건 두 가지였다.

- **테스트와 CI가 "이미 끝난 것"과 "내가 방금 다시 만든 것" 중 뭐가 더 나은지 객관적으로 비교하게 해줬다.** `development`의 기존 구현엔 테스트가 있었고 내 재구현엔 없었다 — 그 차이가 뭘 버려야 할지 바로 알려줬다.
- **작업 트리에 낯선 변경이 섞여 있다는 걸 git status로 즉시 알아챌 수 있었고, 별도 git worktree로 격리해서 작업했기 때문에 다른 세션의 진행 중인 작업을 전혀 건드리지 않았다.** 이건 방법론이라기보다 습관에 가깝지만, "커밋되지 않은 변경은 남의 작업일 수도 있다"는 전제 자체가 여러 에이전트가 동시에 일하는 환경에서만 필요한 감각이다.

TDD가 없었다면 "어느 쪽 구현이 더 나은가"를 판단할 근거가 코드 가독성 정도밖에 없었을 거고, SDD(정본 문서·결정 로그)가 없었다면 애초에 뭐가 이미 결정됐는지조차 몰랐을 것이다.

### 4. 사람이 한 줄씩 리뷰하기엔 이미 늦었다

이 프로젝트의 프론트엔드 코드는 내가 거의 리뷰하지 않았다. 그런데도 배포된 사이트는 정상 동작했다. 이게 가능했던 이유는 "안 봐도 되는" 코드였기 때문이 아니라, **테스트 388개와 CI가 "정상 동작"을 자동으로 증명하는 증거였기 때문**이다. 사람이 모든 diff를 정독하는 건 에이전트 하나가 하루에 만들어내는 코드량 앞에서 이미 확장 가능한 전략이 아니다. 대신 "테스트가 통과하는가", "명세와 어긋나지 않는가"를 자동으로 확인하는 게 리뷰의 실질적인 대체재가 된다.

API 계약도 마찬가지다. 프론트-백엔드 타입이 어긋나는 건 사람 리뷰로 제일 놓치기 쉬운 버그 중 하나인데, 이 프로젝트는 CI에서 OpenAPI 생성물을 다시 만들어 커밋된 것과 diff가 나면 빌드를 실패시킨다. 사람이 "타입이 맞는지 확인해야지"라고 기억할 필요가 아예 없다 — 구조적으로 틀릴 수가 없다.

## 숫자로 보면 (2026-09-23 기준)

| 지표 | 값 |
|---|---|
| 전체 커밋 | 54개 |
| `fix:` 커밋 | 1개 — 그마저도 스펙 드리프트가 아니라 DB SSL 옵션 전달 방식 같은 인프라 설정 이슈 |
| 결정 107건 중 구현 착수 후 번복 | 0건 (설계 단계에서 한 번 바뀐 게 유일한 예외) |
| 테스트 | 388개 (도메인 108·영속성 49·설정 17·API 155·UI 59), 전부 구현 전에 TC로 먼저 정의 |
| 첫 GitHub Actions CI 실행 | 9개 기능이 쌓인 상태에서 한 번에 전부 통과 |

이 수치들이 말하는 건 하나다 — **재작업이 거의 없었다.** "구현하다 보니 스펙이 안 맞아서 되돌아간" 흔적이 커밋 로그에 거의 없다.

## 솔직한 한계

이건 N=1이다. 같은 프로젝트를 SDD·TDD 없이 한 번 더 만들어서 비교한 게 아니라서, 이 낮은 재작업률이 방법론 덕분인지 프로젝트 자체가 학습용이라 복잡도가 낮았던 덕분인지 완전히 분리할 수는 없다.

그리고 SDD는 공짜가 아니다. 문서 쓰는 시간이 실제로 든다. 이 프로젝트도 결정 107개, 문서 20개 넘게 쌓였다. 하룻밤 뚝딱 만드는 사이드 프로젝트, 혹은 나 혼자 한 세션 안에서 끝내는 작업이라면 이 오버헤드가 안 맞을 수 있다. 이 방식이 값을 하는 지점은 명확히 있다: **작업이 여러 세션·여러 에이전트·시간차를 두고 이어질 때, 그리고 사람이 모든 코드를 다 못 읽을 만큼 에이전트가 빠르게 코드를 쓸 때.** 둘 다 "에이전틱 코딩"이라는 말이 가리키는 바로 그 상황이다.

## 다음에 써먹을 것

- **원칙은 헌법 파일 하나에 명문화한다.** `.specify/memory/constitution.md`처럼, "테스트 먼저", "확정 안 된 건 묻는다" 같은 규칙을 매번 프롬프트에 반복하지 않고 한 곳에 박아두면 에이전트가 스스로 지킨다.
- **미결과 결정을 분리해서 추적한다.** "아직 모르는 것"과 "이미 정한 것과 그 이유"가 서로 다른 파일에 있으면, 에이전트가 같은 질문을 두 번 하지 않고 사람도 같은 설명을 두 번 하지 않는다.
- **문서 하나는 짧게 유지한다.** 이 프로젝트는 문서 하나를 200줄 넘기면 하위 문서로 쪼갰다. 에이전트의 컨텍스트 창은 유한하고, 긴 문서는 결국 일부만 읽힌다.
- **커밋 안 된 변경을 보면 "내가 안 만든 걸 수도 있다"고 의심한다.** 여러 세션이 같은 저장소를 건드릴 수 있는 시대에는, `git status`가 항상 내 작업만 보여준다는 가정 자체가 틀릴 수 있다.

## 더 보기

- 저장소: [github.com/joonfluence/to-do-app](https://github.com/joonfluence/to-do-app)
- 문서 지도(진입점): [docs/README.md](https://github.com/joonfluence/to-do-app/blob/a4bf691/docs/README.md)
- 헌법: [.specify/memory/constitution.md](https://github.com/joonfluence/to-do-app/blob/a4bf691/.specify/memory/constitution.md)
- 결정 로그(107건): [docs/decision_log.md](https://github.com/joonfluence/to-do-app/blob/a4bf691/docs/decision_log.md)
- 기능별 spec·plan·tasks: [specs/](https://github.com/joonfluence/to-do-app/tree/a4bf691/specs)
- 실제 서비스: [todo-web-alpha-three.vercel.app](https://todo-web-alpha-three.vercel.app)
