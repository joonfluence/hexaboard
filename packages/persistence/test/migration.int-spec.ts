import { startTestDatabase, type TestDatabase } from './helpers/postgres';

interface ColumnRow {
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  character_maximum_length: number | null;
  collation_name: string | null;
}

describe('ticket 테이블 마이그레이션 (Testcontainers Postgres)', () => {
  let db: TestDatabase;
  const run = <T = unknown>(sql: string, params: unknown[] = []) =>
    db.orm.em.getConnection().execute<T[]>(sql, params);

  beforeAll(async () => {
    db = await startTestDatabase();
  });
  afterAll(async () => {
    await db.stop();
  });
  beforeEach(async () => {
    await db.reset();
  });

  it('컬럼 타입과 널 허용 여부가 데이터 모델과 같다', async () => {
    const rows = await run<ColumnRow>(
      `select column_name, data_type, is_nullable, character_maximum_length, collation_name
         from information_schema.columns where table_name = 'ticket'`,
    );
    const col = (name: string) => rows.find((r) => r.column_name === name);

    expect(col('id')?.data_type).toBe('bigint');
    expect(col('public_id')?.data_type).toBe('uuid');
    expect(col('title')?.data_type).toBe('character varying');
    expect(col('title')?.character_maximum_length).toBe(100);
    expect(col('description')?.data_type).toBe('text');
    expect(col('description')?.is_nullable).toBe('YES');
    expect(col('status')?.is_nullable).toBe('NO');
    expect(col('priority')?.data_type).toBe('smallint');
    expect(col('due_at')?.is_nullable).toBe('YES');
    expect(col('position')?.is_nullable).toBe('NO');
    expect(col('created_at')?.is_nullable).toBe('NO');
    expect(col('updated_at')?.is_nullable).toBe('NO');
  });

  it('position 컬럼만 바이너리 정렬(C collation)을 쓴다', async () => {
    const rows = await run<ColumnRow>(
      `select column_name, collation_name from information_schema.columns
        where table_name = 'ticket' and collation_name is not null`,
    );
    const withCollation = rows.filter((r) => r.collation_name === 'C');
    expect(withCollation.map((r) => r.column_name)).toEqual(['position']);
  });

  const insert = (over: Record<string, unknown> = {}) => {
    const row = {
      public_id: crypto.randomUUID(),
      title: 't',
      status: 'TODO',
      priority: 2,
      position: 'a0',
      ...over,
    };
    return run(
      `insert into ticket (public_id, title, status, priority, position, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [row.public_id, row.title, row.status, row.priority, row.position],
    );
  };

  it('id는 자동 증가한다', async () => {
    await insert({ position: 'a0' });
    await insert({ position: 'a1' });
    const rows = await run<{ id: string }>('select id from ticket order by id');
    expect(Number(rows[1]!.id)).toBe(Number(rows[0]!.id) + 1);
  });

  it('status는 TODO / IN_PROGRESS / DONE만 허용한다 (CHECK)', async () => {
    await expect(insert({ status: 'ARCHIVED' })).rejects.toMatchObject({
      code: '23514',
    });
    await expect(
      insert({ status: 'DONE', position: 'a0' }),
    ).resolves.toBeDefined();
  });

  it('public_id는 유니크다', async () => {
    const publicId = crypto.randomUUID();
    await insert({ public_id: publicId, position: 'a0' });
    await expect(
      insert({ public_id: publicId, position: 'a1' }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('(status, position)은 유니크다. 다른 상태의 같은 position은 허용한다', async () => {
    await insert({ status: 'TODO', position: 'a0' });
    await expect(
      insert({ status: 'TODO', position: 'a0' }),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      insert({ status: 'DONE', position: 'a0' }),
    ).resolves.toBeDefined();
  });

  it('position은 바이트 순서로 정렬된다 (대문자가 소문자보다 앞)', async () => {
    await insert({ position: 'a1' });
    await insert({ position: 'aB' });
    await insert({ position: 'ab' });
    const rows = await run<{ position: string }>(
      'select position from ticket order by position',
    );
    expect(rows.map((r) => r.position)).toEqual(['a1', 'aB', 'ab']);
  });
  it('TC-PER-042: 태그 테이블은 이름이 유니크하고 연결 테이블은 복합 PK다', async () => {
    await run("insert into tag (name) values ('docs')");
    await expect(
      run("insert into tag (name) values ('docs')"),
    ).rejects.toThrow();

    const pk = await run<{ column_name: string }>(
      `select a.attname as column_name
         from pg_index i join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
        where i.indrelid = 'ticket_tag'::regclass and i.indisprimary order by a.attname`,
    );
    expect(pk.map((r) => r.column_name)).toEqual(['tag_id', 'ticket_id']);
  });
});
