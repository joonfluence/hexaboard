import { startTestApp, type TestApp } from './helpers/app';

const ALLOWED = 'http://localhost:3100';

const preflight = (baseUrl: string, origin: string) =>
  fetch(`${baseUrl}/v1/tickets`, {
    method: 'OPTIONS',
    headers: {
      origin,
      'access-control-request-method': 'PATCH',
      'access-control-request-headers': 'content-type',
    },
  });

describe('CORS (api_spec, D-97)', () => {
  describe('허용 오리진이 있을 때', () => {
    let t: TestApp;
    beforeAll(async () => {
      t = await startTestApp({ corsOrigins: [ALLOWED] });
    });
    afterAll(async () => {
      await t.stop();
    });

    it('TC-RUN-011: 허용한 오리진의 사전 요청에 그 오리진과 메서드를 허용한다', async () => {
      const response = await preflight(t.baseUrl, ALLOWED);

      expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED);
      const methods =
        response.headers.get('access-control-allow-methods') ?? '';
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        expect(methods).toContain(method);
      }
      expect(
        response.headers.get('access-control-allow-headers')?.toLowerCase(),
      ).toContain('content-type');
    });

    it('X-Request-Id 요청 헤더를 허용하고 응답 헤더로 노출한다(프런트→백엔드 추적)', async () => {
      const pre = await fetch(`${t.baseUrl}/v1/tickets`, {
        method: 'OPTIONS',
        headers: {
          origin: ALLOWED,
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'x-request-id',
        },
      });
      expect(
        pre.headers.get('access-control-allow-headers')?.toLowerCase(),
      ).toContain('x-request-id');

      const response = await fetch(`${t.baseUrl}/health`, {
        headers: { origin: ALLOWED },
      });
      expect(
        response.headers.get('access-control-expose-headers')?.toLowerCase(),
      ).toContain('x-request-id');
    });

    it('W3C 트레이스 헤더(traceparent, tracestate)를 허용한다(웹→서버 트레이스 연결)', async () => {
      const pre = await fetch(`${t.baseUrl}/v1/tickets`, {
        method: 'OPTIONS',
        headers: {
          origin: ALLOWED,
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'traceparent,tracestate',
        },
      });
      const allowed =
        pre.headers.get('access-control-allow-headers')?.toLowerCase() ?? '';
      expect(allowed).toContain('traceparent');
      expect(allowed).toContain('tracestate');
    });

    it('TC-RUN-012: 허용하지 않은 오리진에는 허용 헤더를 주지 않는다', async () => {
      const response = await preflight(t.baseUrl, 'https://evil.example.com');

      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
  });

  describe('허용 오리진이 없을 때', () => {
    let t: TestApp;
    beforeAll(async () => {
      t = await startTestApp();
    });
    afterAll(async () => {
      await t.stop();
    });

    it('TC-RUN-012: 어떤 오리진에도 허용 헤더를 주지 않는다', async () => {
      const response = await preflight(t.baseUrl, ALLOWED);

      expect(response.headers.get('access-control-allow-origin')).toBeNull();
    });
  });
});
