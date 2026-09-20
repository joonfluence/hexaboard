import { startTestApp, type TestApp } from './helpers/app';

describe('API 하네스', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await startTestApp();
  });
  afterAll(async () => {
    await t.stop();
  });

  it('없는 경로는 프레임워크 기본 404를 돌려준다', async () => {
    const response = await fetch(`${t.baseUrl}/v1/does-not-exist`);
    expect(response.status).toBe(404);
  });

  it('접두사 없는 경로도 404다', async () => {
    const response = await fetch(`${t.baseUrl}/tickets`);
    expect(response.status).toBe(404);
  });
});
