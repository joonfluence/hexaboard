import { startTestApp, type TestApp } from './helpers/app';
import { postRaw } from './helpers/http';

describe('POST /v1/tickets 본문·미디어 타입 (US3)', () => {
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

  it('TC-API-024: V7 올바르지 않은 JSON이면 400 INVALID_REQUEST_BODY', async () => {
    const response = await postRaw(t.baseUrl, '{"title": ', 'application/json');
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toMatchObject({
      statusCode: 400,
      code: 'INVALID_REQUEST_BODY',
      message: expect.any(String),
    });
    expect(await t.sql('select count(*) from ticket')).toBe('0');
  });

  it('TC-API-025: V8 Content-Type이 JSON이 아니면 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const response = await postRaw(t.baseUrl, 'title=abc', 'text/plain');
    const json = await response.json();

    expect(response.status).toBe(415);
    expect(json).toMatchObject({
      statusCode: 415,
      code: 'UNSUPPORTED_MEDIA_TYPE',
      message: expect.any(String),
    });
    expect(await t.sql('select count(*) from ticket')).toBe('0');
  });
});
