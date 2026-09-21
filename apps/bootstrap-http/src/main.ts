import { telemetry } from './telemetry';
import 'reflect-metadata';
import { createApp } from './app.factory';
import { jsonLineSink, otelLogSink } from './common/request-logging';
import {
  readCorsOrigins,
  readDatabaseSettings,
  readMigrateOnStart,
  readPort,
} from './config';

async function bootstrap(): Promise<void> {
  const app = await createApp(readDatabaseSettings(process.env), {
    corsOrigins: readCorsOrigins(process.env),
    accessLog: telemetry
      ? (entry) => {
          jsonLineSink(entry);
          otelLogSink(entry);
        }
      : jsonLineSink,
    migrateOnStart: readMigrateOnStart(process.env),
  });
  app.enableShutdownHooks();
  // 종료 전에 아직 보내지 못한 트레이스·로그·메트릭을 내보낸다.
  process.once('SIGTERM', () => void telemetry?.shutdown());
  await app.listen(readPort(process.env));
}

void bootstrap();
