import {
  getWebInstrumentations,
  initializeFaro,
  type TransportItem,
} from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

let initialized = false;

/**
 * 페이지 주소에서 쿼리스트링과 해시를 뗀다.
 * 필터 검색어(`q`) 같은 사용자 입력이 주소에 실려 외부로 나가지 않게 한다.
 */
export function scrubUrl(url: string): string {
  return url.split(/[?#]/)[0] ?? '';
}

/** 전송 직전에 개인정보가 섞일 수 있는 값을 제거한다(FR 개인정보 마스킹). */
export function scrubItem<T>(item: TransportItem<T>): TransportItem<T> {
  const page = item.meta?.page;
  if (page?.url) {
    page.url = scrubUrl(page.url);
  }
  return item;
}

/** 트레이스 헤더를 붙일 API 오리진. 주소가 없거나 잘못되면 어디에도 붙이지 않는다. */
export function apiOrigins(
  baseUrl: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL,
): string[] {
  try {
    return baseUrl ? [new URL(baseUrl).origin] : [];
  } catch {
    return [];
  }
}

/**
 * 브라우저 오류·성능을 Grafana Faro로 보낸다. 수집 주소는 환경변수로 받고,
 * 없으면(로컬·테스트) 아무것도 하지 않는다. 콘솔 로그는 수집하지 않는다.
 */
export function initObservability(): void {
  const url = process.env.NEXT_PUBLIC_FARO_URL;
  if (initialized || !url) {
    return;
  }
  initializeFaro({
    url,
    app: {
      name: 'todo-web',
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      environment: process.env.NODE_ENV,
    },
    instrumentations: [
      ...getWebInstrumentations({ captureConsole: false }),
      // 서버 API로 가는 요청에만 traceparent를 실어 서버 트레이스와 한 트레이스로 잇는다.
      // 서버 CORS가 traceparent를 허용해야 하므로 서버를 먼저 배포한다.
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: apiOrigins(),
        },
      }),
    ],
    beforeSend: scrubItem,
  });
  initialized = true;
}

export interface ApiFailure {
  requestId: string;
  status: number;
  method: string;
  path: string;
}

/** API 실패를 요청 ID와 함께 남겨 서버 접근 로그와 잇는다. 본문·쿼리스트링은 남기지 않는다. */
export async function reportApiFailure(failure: ApiFailure): Promise<void> {
  if (!initialized) {
    return;
  }
  const { faro } = await import('@grafana/faro-web-sdk');
  faro.api.pushEvent('api_failure', {
    requestId: failure.requestId,
    status: String(failure.status),
    method: failure.method,
    path: failure.path,
  });
}
