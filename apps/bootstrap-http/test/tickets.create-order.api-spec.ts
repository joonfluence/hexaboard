import { startTestApp, type TestApp } from './helpers/app';
import { postTicket } from './helpers/http';

describe('POST /v1/tickets 새 티켓의 위치 (D-79, FR-009)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await startTestApp();
  });
  afterAll(async () => {
    await t.stop();
  });
  beforeEach(async () => {
    await t.reset();
  });

  const positions = async () =>
    (await t.sql('select position from ticket order by position'))
      .split('\n')
      .filter(Boolean);

  it('새 티켓은 TODO 컬럼의 맨 뒤에 놓인다', async () => {
    for (const title of ['첫째', '둘째', '셋째']) {
      await postTicket(t.baseUrl, { title });
    }

    const titles = (
      await t.sql('select title from ticket order by position')
    ).split('\n');
    expect(titles).toEqual(['첫째', '둘째', '셋째']);
  });

  it('기존 카드의 순서 키는 바뀌지 않는다', async () => {
    await postTicket(t.baseUrl, { title: 'A' });
    await postTicket(t.baseUrl, { title: 'B' });
    const before = await positions();

    await postTicket(t.baseUrl, { title: 'C' });
    const after = await positions();

    expect(after.slice(0, 2)).toEqual(before);
    expect(after).toHaveLength(3);
    expect(after[2]! > before[1]!).toBe(true);
  });
});
