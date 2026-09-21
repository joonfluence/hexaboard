import { PositionConflictError } from '@todo/application';
import { Position, Ticket } from '@todo/domain';
import { MikroOrmTicketRepository } from '../src/mikro-orm-ticket.repository';
import { startTestDatabase, type TestDatabase } from './helpers/postgres';

describe('MikroOrmTicketRepository (Testcontainers Postgres)', () => {
  let db: TestDatabase;
  let repository: MikroOrmTicketRepository;

  beforeAll(async () => {
    db = await startTestDatabase();
    repository = new MikroOrmTicketRepository(db.orm);
  });
  afterAll(async () => {
    await db.stop();
  });
  beforeEach(async () => {
    await db.reset();
  });

  const newTicket = (position: Position, title = '티켓') =>
    Ticket.create({ title, position });

  it('저장 후 ticketId로 조회하면 같은 값이 돌아온다 (G1의 기반)', async () => {
    const saved = await repository.save(
      Ticket.create({
        title: '문서 정리',
        description: '설명',
        priority: 'HIGH',
        dueAt: new Date('2026-12-31T23:59:00.000Z'),
        position: Position.first(),
      }),
    );

    const found = await repository.findByTicketId(saved.ticketId);

    expect(found).not.toBeNull();
    expect(found!.ticketId).toBe(saved.ticketId);
    expect(found!.title.value).toBe('문서 정리');
    expect(found!.description).toBe('설명');
    expect(found!.status).toBe('TODO');
    expect(found!.priority.value).toBe('HIGH');
    expect(found!.dueAt).toEqual(new Date('2026-12-31T23:59:00.000Z'));
    expect(found!.position.value).toBe('a0');
  });

  it('저장하면 ORM 훅이 생성·수정 시각을 채운다', async () => {
    const saved = await repository.save(newTicket(Position.first()));
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it('없는 ticketId는 null을 돌려준다', async () => {
    expect(await repository.findByTicketId(crypto.randomUUID())).toBeNull();
  });

  it('컬럼(상태)별 마지막 순서 키를 조회한다. 빈 컬럼은 null이다', async () => {
    expect(await repository.findLastPosition('TODO')).toBeNull();

    const first = Position.first();
    await repository.save(newTicket(first));
    await repository.save(newTicket(Position.after(first)));

    expect((await repository.findLastPosition('TODO'))?.value).toBe(
      Position.after(first).value,
    );
    expect(await repository.findLastPosition('DONE')).toBeNull();
  });

  it('같은 (상태, 순서 키)를 저장하면 순서 충돌 오류로 변환한다', async () => {
    await repository.save(newTicket(Position.first()));
    await expect(
      repository.save(newTicket(Position.first())),
    ).rejects.toBeInstanceOf(PositionConflictError);
  });

  it('충돌 뒤에도 저장소는 정상 동작한다', async () => {
    await repository.save(newTicket(Position.first()));
    await expect(
      repository.save(newTicket(Position.first())),
    ).rejects.toBeInstanceOf(PositionConflictError);
    await expect(
      repository.save(newTicket(Position.after(Position.first()))),
    ).resolves.toBeDefined();
  });

  it('새 티켓을 이어서 저장하면 순서 키가 생성 순으로 증가한다 (D-79)', async () => {
    const titles = ['첫째', '둘째', '셋째'];
    for (const title of titles) {
      const last = await repository.findLastPosition('TODO');
      await repository.save(
        newTicket(last ? Position.after(last) : Position.first(), title),
      );
    }

    const rows = await db.orm.em
      .getConnection()
      .execute<{ title: string }[]>(
        'select title from ticket order by position',
      );
    expect(rows.map((r) => r.title)).toEqual(titles);
  });

  it('조회 결과 어디에도 내부 PK가 없다', async () => {
    const saved = await repository.save(newTicket(Position.first()));
    const found = await repository.findByTicketId(saved.ticketId);
    expect(Object.keys(found!)).not.toContain('id');
    expect(JSON.stringify(found)).not.toMatch(/"id"/);
  });
  describe('전체 조회와 삭제 (002)', () => {
    const inStatus = async (
      status: 'TODO' | 'IN_PROGRESS' | 'DONE',
      title: string,
      key: string,
    ) => {
      const saved = await repository.save(
        Ticket.create({ title, position: Position.from(key) }),
      );
      await db.orm.em
        .getConnection()
        .execute(
          `UPDATE ticket SET status = '${status}' WHERE public_id = '${saved.ticketId}'`,
        );
      return saved;
    };

    it('TC-PER-023: 빈 저장소를 전체 조회하면 빈 배열이다', async () => {
      expect(await repository.findAll()).toEqual([]);
    });

    it('TC-PER-024: 상태 순서이고 같은 상태는 순서 키 오름차순이다', async () => {
      await inStatus('DONE', 'done-2', 'a1');
      await inStatus('TODO', 'todo-2', 'a1');
      await inStatus('IN_PROGRESS', 'prog', 'a0');
      await inStatus('DONE', 'done-1', 'a0');
      await inStatus('TODO', 'todo-1', 'a0');

      const all = await repository.findAll();

      expect(all.map((ticket) => ticket.title.value)).toEqual([
        'todo-1',
        'todo-2',
        'prog',
        'done-1',
        'done-2',
      ]);
    });

    it('TC-PER-025: ticketId로 삭제하면 true이고 다른 티켓은 그대로다', async () => {
      const a = await repository.save(newTicket(Position.first(), 'a'));
      const b = await repository.save(
        newTicket(Position.after(Position.first()), 'b'),
      );

      expect(await repository.deleteByTicketId(a.ticketId)).toBe(true);

      expect(await repository.findByTicketId(a.ticketId)).toBeNull();
      expect(await repository.findByTicketId(b.ticketId)).not.toBeNull();
    });

    it('TC-PER-026: 없는 ticketId를 삭제하면 false다', async () => {
      expect(
        await repository.deleteByTicketId(
          '00000000-0000-4000-8000-000000000000',
        ),
      ).toBe(false);
    });
  });
  describe('수정 (003)', () => {
    it('TC-PER-027: 수정한 티켓을 저장하면 값이 반영되고 시각 외 불변 필드는 그대로다', async () => {
      const saved = await repository.save(
        Ticket.create({
          title: '원래',
          description: '설명',
          priority: 'LOW',
          position: Position.first(),
        }),
      );

      const updated = await repository.update(
        saved.update({
          title: '바뀜',
          description: null,
          priority: 'URGENT',
          dueAt: new Date('2027-01-01T00:00:00.000Z'),
        }),
      );

      const found = await repository.findByTicketId(saved.ticketId);
      expect(updated).not.toBeNull();
      expect(found!.title.value).toBe('바뀜');
      expect(found!.description).toBeNull();
      expect(found!.priority.value).toBe('URGENT');
      expect(found!.dueAt).toEqual(new Date('2027-01-01T00:00:00.000Z'));
      expect(found!.status).toBe('TODO');
      expect(found!.position.value).toBe('a0');
      expect(found!.createdAt).toEqual(saved.createdAt);
      expect(found!.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        saved.updatedAt!.getTime(),
      );
      expect(updated!.updatedAt).toEqual(found!.updatedAt);
    });

    it('TC-PER-028: 없는 ticketId를 수정하면 null이다', async () => {
      const ghost = Ticket.create({
        title: '없는 티켓',
        position: Position.first(),
      });
      expect(await repository.update(ghost)).toBeNull();
    });

    it('TC-PER-029: 한 티켓을 수정해도 다른 티켓은 그대로다', async () => {
      const a = await repository.save(newTicket(Position.first(), 'a'));
      const b = await repository.save(
        newTicket(Position.after(Position.first()), 'b'),
      );

      await repository.update(a.update({ title: 'a2' }));

      const other = await repository.findByTicketId(b.ticketId);
      expect(other!.title.value).toBe('b');
      expect(other!.updatedAt).toEqual(b.updatedAt);
    });
  });
  describe('이동 (004)', () => {
    const seed = async (
      status: 'TODO' | 'IN_PROGRESS' | 'DONE',
      title: string,
      key: string,
    ) => {
      const saved = await repository.save(
        Ticket.create({ title, position: Position.from(key) }),
      );
      await db.orm.em
        .getConnection()
        .execute(
          `UPDATE ticket SET status = '${status}' WHERE public_id = '${saved.ticketId}'`,
        );
      return saved;
    };

    it('TC-PER-030: 같은 상태에서 기준 바로 앞·뒤 키를 찾고, 제외한 티켓과 다른 상태는 무시한다', async () => {
      const a = await seed('TODO', 'a', 'a0');
      const b = await seed('TODO', 'b', 'a1');
      const c = await seed('TODO', 'c', 'a2');
      await seed('DONE', 'other', 'a1V');

      expect(
        (await repository.findAdjacentPosition(
          'TODO',
          b.position,
          'BEFORE',
          c.ticketId,
        ))!.value,
      ).toBe('a0');
      expect(
        (await repository.findAdjacentPosition(
          'TODO',
          b.position,
          'AFTER',
          a.ticketId,
        ))!.value,
      ).toBe('a2');
      // 제외한 티켓은 이웃으로 치지 않는다: b 앞의 a를 제외하면 앞 이웃이 없다.
      expect(
        await repository.findAdjacentPosition(
          'TODO',
          b.position,
          'BEFORE',
          a.ticketId,
        ),
      ).toBeNull();
      expect(
        await repository.findAdjacentPosition(
          'TODO',
          c.position,
          'AFTER',
          a.ticketId,
        ),
      ).toBeNull();
    });

    it('TC-PER-031: 제외 티켓 말고 카드가 있는지 알려 준다', async () => {
      const a = await seed('TODO', 'a', 'a0');

      expect(
        await repository.hasTicketsInStatus(
          'TODO',
          '00000000-0000-4000-8000-000000000000',
        ),
      ).toBe(true);
      expect(await repository.hasTicketsInStatus('TODO', a.ticketId)).toBe(
        false,
      );
      expect(await repository.hasTicketsInStatus('DONE', a.ticketId)).toBe(
        false,
      );
    });

    it('TC-PER-032: 이동하면 상태와 순서 키만 바뀌고 나머지는 그대로다', async () => {
      const saved = await repository.save(
        Ticket.create({
          title: '원래',
          description: '설명',
          priority: 'HIGH',
          position: Position.first(),
        }),
      );

      const moved = await repository.move(
        saved.ticketId,
        'IN_PROGRESS',
        Position.from('a5'),
      );

      const found = await repository.findByTicketId(saved.ticketId);
      expect(moved).not.toBeNull();
      expect(found!.status).toBe('IN_PROGRESS');
      expect(found!.position.value).toBe('a5');
      expect(found!.title.value).toBe('원래');
      expect(found!.description).toBe('설명');
      expect(found!.priority.value).toBe('HIGH');
      expect(found!.createdAt).toEqual(saved.createdAt);
      expect(found!.updatedAt!.getTime()).toBeGreaterThanOrEqual(
        saved.updatedAt!.getTime(),
      );
    });

    it('TC-PER-033: 이미 쓰는 (상태, 순서 키)로 이동하면 PositionConflictError이고 티켓은 그대로다', async () => {
      await seed('DONE', 'existing', 'a0');
      const saved = await repository.save(newTicket(Position.first(), 'mover'));

      await expect(
        repository.move(saved.ticketId, 'DONE', Position.from('a0')),
      ).rejects.toBeInstanceOf(PositionConflictError);

      const found = await repository.findByTicketId(saved.ticketId);
      expect(found!.status).toBe('TODO');
    });

    it('TC-PER-034: 없는 티켓을 이동하면 null이다', async () => {
      expect(
        await repository.move(
          '00000000-0000-4000-8000-000000000000',
          'DONE',
          Position.first(),
        ),
      ).toBeNull();
    });
  });
  describe('정렬 지원 (006)', () => {
    it('TC-PER-035: 상태별 조회는 그 상태 카드만 순서 키 오름차순으로 돌려준다', async () => {
      const a = await repository.save(newTicket(Position.first(), 'a'));
      await repository.save(newTicket(Position.after(Position.first()), 'b'));
      await db.orm.em
        .getConnection()
        .execute(
          `UPDATE ticket SET status = 'DONE' WHERE public_id = '${a.ticketId}'`,
        );

      expect(
        (await repository.findByStatus('TODO')).map((x) => x.title.value),
      ).toEqual(['b']);
      expect(
        (await repository.findByStatus('DONE')).map((x) => x.title.value),
      ).toEqual(['a']);
    });

    it('TC-PER-036: 순서를 다시 써도 기존 키와 겹치지 않고 다른 상태·내용은 그대로다', async () => {
      const a = await repository.save(newTicket(Position.first(), 'a'));
      const b = await repository.save(
        newTicket(Position.after(Position.first()), 'b'),
      );
      const c = await repository.save(
        newTicket(Position.after(Position.after(Position.first())), 'c'),
      );

      // 순서를 뒤집으면 새 키(a0,a1,a2)가 다른 카드의 기존 키와 겹친다.
      const first = Position.first();
      const second = Position.after(first);
      const third = Position.after(second);
      await repository.reorder('TODO', [
        { ticketId: c.ticketId, position: first },
        { ticketId: b.ticketId, position: second },
        { ticketId: a.ticketId, position: third },
      ]);

      const list = await repository.findByStatus('TODO');
      expect(list.map((x) => x.title.value)).toEqual(['c', 'b', 'a']);
      expect(list.map((x) => x.position.value)).toEqual(['a0', 'a1', 'a2']);
    });
  });
  describe('태그 (007)', () => {
    const tagged = (title: string, key: string, tags: string[]) =>
      Ticket.create({ title, tags, position: Position.from(key) });
    const tagRows = () =>
      db.orm.em
        .getConnection()
        .execute<{ name: string }[]>('select name from tag order by name');

    it('TC-PER-037: 태그와 함께 저장하면 이름 오름차순으로 돌아온다', async () => {
      const saved = await repository.save(tagged('a', 'a0', ['b', 'a']));

      expect(saved.tags).toEqual(['a', 'b']);
      expect((await repository.findByTicketId(saved.ticketId))!.tags).toEqual([
        'a',
        'b',
      ]);
    });

    it('TC-PER-038: 두 티켓이 같은 태그 이름을 쓰면 tag 행은 하나다', async () => {
      await repository.save(tagged('a', 'a0', ['docs']));
      await repository.save(tagged('b', 'a1', ['docs', 'x']));

      expect((await tagRows()).map((r) => r.name)).toEqual(['docs', 'x']);
    });

    it('TC-PER-039: 수정 저장은 태그를 교체하고 빈 배열은 모두 제거한다', async () => {
      const saved = await repository.save(tagged('a', 'a0', ['a', 'b']));

      const changed = await repository.update(
        saved.update({ tags: ['b', 'c'] }),
      );
      expect(changed!.tags).toEqual(['b', 'c']);
      expect((await repository.findByTicketId(saved.ticketId))!.tags).toEqual([
        'b',
        'c',
      ]);

      await repository.update(saved.update({ tags: [] }));
      expect((await repository.findByTicketId(saved.ticketId))!.tags).toEqual(
        [],
      );
    });

    it('TC-PER-040: 전체·상태별 조회와 이동 결과에도 태그가 있다', async () => {
      const a = await repository.save(tagged('a', 'a0', ['x']));
      await repository.save(tagged('b', 'a1', ['y', 'z']));

      expect((await repository.findAll()).map((t) => t.tags)).toEqual([
        ['x'],
        ['y', 'z'],
      ]);
      expect(
        (await repository.findByStatus('TODO')).map((t) => t.tags),
      ).toEqual([['x'], ['y', 'z']]);
      expect(
        (await repository.move(a.ticketId, 'DONE', Position.first()))!.tags,
      ).toEqual(['x']);
    });

    it('TC-PER-041: 티켓을 삭제하면 그 티켓의 연결만 사라진다', async () => {
      const a = await repository.save(tagged('a', 'a0', ['x']));
      const b = await repository.save(tagged('b', 'a1', ['x', 'y']));

      await repository.deleteByTicketId(a.ticketId);

      expect((await repository.findByTicketId(b.ticketId))!.tags).toEqual([
        'x',
        'y',
      ]);
      const links = await db.orm.em
        .getConnection()
        .execute<{ n: string }[]>('select count(*)::text as n from ticket_tag');
      expect(links[0]!.n).toBe('2');
    });
  });
  describe('필터 (008)', () => {
    const put = async (
      title: string,
      key: string,
      extra: {
        description?: string;
        priority?: string;
        tags?: string[];
        status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
      } = {},
    ) => {
      const saved = await repository.save(
        Ticket.create({
          title,
          description: extra.description,
          priority: extra.priority,
          tags: extra.tags,
          position: Position.from(key),
        }),
      );
      if (extra.status) {
        await db.orm.em
          .getConnection()
          .execute(
            `UPDATE ticket SET status = '${extra.status}' WHERE public_id = '${saved.ticketId}'`,
          );
      }
      return saved;
    };
    const titles = async (filter: Parameters<typeof repository.findAll>[0]) =>
      (await repository.findAll(filter)).map((t) => t.title.value);

    it('TC-PER-043: 검색어는 제목·설명에서 대소문자 무시 부분 일치이고 %·_는 글자 그대로다', async () => {
      await put('Fix Login', 'a0');
      await put('문서', 'a1', { description: '로그인 화면 login' });
      await put('100% done', 'a2');
      await put('a_b', 'a3');
      await put('axb', 'a4');

      expect(await titles({ q: 'LOGIN' })).toEqual(['Fix Login', '문서']);
      expect(await titles({ q: '100%' })).toEqual(['100% done']);
      expect(await titles({ q: 'a_b' })).toEqual(['a_b']);
    });

    it('TC-PER-044: 상태·우선순위 필터는 같은 종류 여러 값이 OR이다', async () => {
      await put('a', 'a0', { priority: 'LOW' });
      await put('b', 'a1', { priority: 'HIGH', status: 'DONE' });
      await put('c', 'a2', { priority: 'URGENT', status: 'IN_PROGRESS' });

      expect(await titles({ priorities: ['LOW', 'URGENT'] })).toEqual([
        'a',
        'c',
      ]);
      expect(await titles({ statuses: ['DONE', 'IN_PROGRESS'] })).toEqual([
        'c',
        'b',
      ]);
    });

    it('TC-PER-045: 태그 필터는 하나라도 가진 티켓이고 이름은 정규화해 비교한다', async () => {
      await put('a', 'a0', { tags: ['x'] });
      await put('b', 'a1', { tags: ['y', 'z'] });
      await put('c', 'a2');

      expect(await titles({ tags: ['x', 'z'] })).toEqual(['a', 'b']);
      expect(await titles({ tags: [' X '] })).toEqual(['a']);
      expect(await titles({ tags: ['none'] })).toEqual([]);
    });

    it('TC-PER-046: 여러 종류의 조건은 AND이고 순서는 필터 없는 목록과 같다', async () => {
      await put('a fix', 'a0', { priority: 'HIGH', tags: ['x'] });
      await put('b fix', 'a1', { priority: 'LOW', tags: ['x'] });
      await put('c fix', 'a2', {
        priority: 'HIGH',
        tags: ['x'],
        status: 'DONE',
      });
      await put('d', 'a3', { priority: 'HIGH', tags: ['x'] });

      expect(
        await titles({ q: 'fix', priorities: ['HIGH'], tags: ['x'] }),
      ).toEqual(['a fix', 'c fix']);
      expect(await titles({})).toEqual(['a fix', 'b fix', 'd', 'c fix']);
      expect(await titles(undefined)).toEqual(['a fix', 'b fix', 'd', 'c fix']);
    });
  });
});
