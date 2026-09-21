import { startTelemetry } from './instrumentation';

/** 부수 효과 모듈. 다른 import보다 먼저 불러와 http·express·pg 계측이 걸리게 한다. */
export const telemetry = startTelemetry(process.env);
