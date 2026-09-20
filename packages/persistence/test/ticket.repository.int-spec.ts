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
});
