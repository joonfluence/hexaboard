import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * 태그 이름과 연결 테이블 읽기·쓰기. 태그는 티켓의 값 목록이라 ORM 관계 대신 SQL로 다룬다.
 * 쓰기는 호출자의 트랜잭션 안에서 실행한다.
 */
export class TicketTags {
  private static readonly placeholders = (n: number) =>
    Array.from({ length: n }, () => '?').join(', ');

  /** 티켓 내부 PK별 태그 이름(오름차순). 태그가 없는 티켓은 항목이 없다. */
  async read(
    em: EntityManager,
    ticketPks: readonly string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (ticketPks.length === 0) {
      return result;
    }
    const rows = await em
      .getConnection()
      .execute<{ ticket_id: string; name: string }[]>(
        `select tt.ticket_id::text as ticket_id, t.name
         from ticket_tag tt join tag t on t.id = tt.tag_id
        where tt.ticket_id in (${TicketTags.placeholders(ticketPks.length)})
        order by t.name collate "C"`,
        [...ticketPks],
      );
    for (const row of rows) {
      result.set(row.ticket_id, [
        ...(result.get(row.ticket_id) ?? []),
        row.name,
      ]);
    }
    return result;
  }

  /** 티켓의 태그를 주어진 집합으로 바꾼다. 없는 태그 행은 만들고 연결은 통째로 다시 쓴다. */
  async replace(
    em: EntityManager,
    ticketPk: string,
    names: readonly string[],
  ): Promise<void> {
    const ctx = em.getTransactionContext();
    const run = (sql: string, params: unknown[]) =>
      em.getConnection().execute(sql, params, 'run', ctx);

    await run('delete from ticket_tag where ticket_id = ?', [ticketPk]);
    if (names.length === 0) {
      return;
    }
    const marks = TicketTags.placeholders(names.length);
    await run(
      `insert into tag (name) values ${names.map(() => '(?)').join(', ')} on conflict (name) do nothing`,
      [...names],
    );
    await run(
      `insert into ticket_tag (ticket_id, tag_id) select ?, id from tag where name in (${marks})`,
      [ticketPk, ...names],
    );
  }

  /** 주어진 이름 중 하나라도 가진 티켓의 내부 PK. */
  async ticketPksWithAny(
    em: EntityManager,
    names: readonly string[],
  ): Promise<string[]> {
    const rows = await em.getConnection().execute<{ ticket_id: string }[]>(
      `select distinct tt.ticket_id::text as ticket_id
         from ticket_tag tt join tag t on t.id = tt.tag_id
        where t.name in (${TicketTags.placeholders(names.length)})`,
      [...names],
    );
    return rows.map((row) => row.ticket_id);
  }
}
