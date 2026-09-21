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
});
