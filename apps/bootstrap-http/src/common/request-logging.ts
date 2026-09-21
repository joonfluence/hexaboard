import { randomUUID } from 'node:crypto';
import { ROOT_CONTEXT, trace } from '@opentelemetry/api';
import { SeverityNumber, logs } from '@opentelemetry/api-logs';

interface RequestLike {
  method: string;
  originalUrl: string;
  headers: Record<string, string | string[] | undefined>;
}

interface ResponseLike {
  statusCode: number;
  setHeader(name: string, value: string): void;
  on(event: 'finish', listener: () => void): void;
}

export interface AccessLogEntry {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  /** 계측이 켜져 있을 때만 있다. 로그와 트레이스를 잇는 키다. */
  traceId?: string;
  spanId?: string;
}

export const REQUEST_ID_HEADER = 'x-request-id';

/** 로그·헤더에 그대로 싣기에 안전한 요청 ID만 받아들인다(길이·문자 제한). */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

function pickRequestId(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  return value !== undefined && SAFE_REQUEST_ID.test(value)
    ? value
    : randomUUID();
}

/**
 * 요청 ID를 정하고 응답 헤더로 돌려주며, 응답이 끝나면 접근 로그 한 줄을 남긴다.
 * 쿼리스트링(검색어 등)과 본문은 개인정보가 섞일 수 있어 기록하지 않는다.
 */
export function requestLogging(write: (entry: AccessLogEntry) => void) {
  return (req: RequestLike, res: ResponseLike, next: () => void): void => {
    const requestId = pickRequestId(req.headers[REQUEST_ID_HEADER]);
    const startedAt = process.hrtime.bigint();
    res.setHeader('X-Request-Id', requestId);
    // 트레이스에서도 웹(Faro)이 보낸 요청 ID로 찾을 수 있게 한다. 계측이 꺼져 있으면 아무 일도 하지 않는다.
    const span = trace.getActiveSpan();
    span?.setAttribute('app.request_id', requestId);
    const spanContext = span?.spanContext();
    res.on('finish', () => {
      write({
        requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0] ?? '',
        status: res.statusCode,
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
        ...(spanContext && {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
        }),
      });
    });
    next();
  };
}

/** 표준 출력에 JSON 한 줄로 쓰는 기본 싱크. 수집기(Loki 등)가 줄 단위로 읽는다. */
export function jsonLineSink(entry: AccessLogEntry): void {
  process.stdout.write(
    `${JSON.stringify({ level: 'info', msg: 'request', ...entry })}\n`,
  );
}

/** OTel 로그로 보내는 싱크. 트레이스 ID를 실어 Grafana에서 로그↔트레이스를 오갈 수 있게 한다. */
export function otelLogSink(entry: AccessLogEntry): void {
  const { traceId, spanId, ...attributes } = entry;
  logs.getLogger('access').emit({
    severityNumber:
      entry.status >= 500 ? SeverityNumber.ERROR : SeverityNumber.INFO,
    severityText: entry.status >= 500 ? 'ERROR' : 'INFO',
    body: 'request',
    attributes,
    ...(traceId &&
      spanId && {
        context: trace.setSpanContext(ROOT_CONTEXT, {
          traceId,
          spanId,
          traceFlags: 1,
        }),
      }),
  });
}
