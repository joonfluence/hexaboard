import type { AccessLogEntry } from '../src/common/request-logging';
import { startTestApp, type TestApp } from './helpers/app';

describe('요청 ID와 접근 로그', () => {
  const logs: AccessLogEntry[] = [];
  let t: TestApp;

  beforeAll(async () => {
    t = await startTestApp({ accessLog: (entry) => logs.push(entry) });
  });
  afterAll(async () => {
    await t.stop();
  });
  beforeEach(() => {
    logs.length = 0;
  });

  const lastLog = async (): Promise<AccessLogEntry> => {
    // 로그는 응답이 끝난 뒤 기록되므로 잠깐 기다린다.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const entry = logs.at(-1);
    if (!entry) throw new Error('접근 로그가 없습니다');
    return entry;
  };

  it('요청 ID를 만들어 응답 헤더로 돌려주고 로그에 남긴다', async () => {
    const response = await fetch(`${t.baseUrl}/health`);
    const id = response.headers.get('x-request-id');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await lastLog()).toMatchObject({
      requestId: id,
      method: 'GET',
      path: '/health',
      status: 200,
    });
  });

  it('안전한 X-Request-Id는 그대로 이어받는다(프런트→백엔드 추적)', async () => {
    const response = await fetch(`${t.baseUrl}/health`, {
      headers: { 'X-Request-Id': 'web-abc_123' },
    });
    expect(response.headers.get('x-request-id')).toBe('web-abc_123');
    expect((await lastLog()).requestId).toBe('web-abc_123');
  });

  it('안전하지 않은 요청 ID는 버리고 새로 만든다', async () => {
    const response = await fetch(`${t.baseUrl}/health`, {
      headers: { 'X-Request-Id': 'a b<script>' },
    });
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('쿼리스트링(검색어)은 로그에 남기지 않는다', async () => {
    await fetch(`${t.baseUrl}/v1/tickets?q=비밀제목`);
    const entry = await lastLog();
    expect(entry.path).toBe('/v1/tickets');
    expect(JSON.stringify(entry)).not.toContain('비밀제목');
  });
});
