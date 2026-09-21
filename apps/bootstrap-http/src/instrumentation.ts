import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

/**
 * OpenTelemetry 계측을 켠다. 다른 모듈(http, express, pg)보다 먼저 불러와야 자동 계측이 걸리므로
 * `main.ts`의 첫 import여야 한다.
 *
 * 엔드포인트·인증은 표준 환경변수(`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`,
 * `OTEL_SERVICE_NAME`)를 SDK가 직접 읽는다. 엔드포인트가 없으면 켜지 않는다(로컬·테스트).
 * 벤더가 바뀌어도 엔드포인트만 바꾸면 된다(OTLP 표준).
 */
export function startTelemetry(
  env: Readonly<Record<string, string | undefined>>,
): NodeSDK | undefined {
  if (!env['OTEL_EXPORTER_OTLP_ENDPOINT']) {
    return undefined;
  }
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
    }),
    logRecordProcessors: [
      new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() }),
    ],
    instrumentations: [
      new HttpInstrumentation({
        // 유휴 DB·플랫폼 헬스체크가 트레이스를 채우지 않게 뺀다.
        ignoreIncomingRequestHook: (req) => req.url === '/health',
      }),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
    ],
  });
  sdk.start();
  return sdk;
}
