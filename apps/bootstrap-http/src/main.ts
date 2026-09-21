import 'reflect-metadata';
import { createApp } from './app.factory';
import {
  readCorsOrigins,
  readDatabaseSettings,
  readMigrateOnStart,
  readPort,
} from './config';

async function bootstrap(): Promise<void> {
  const app = await createApp(readDatabaseSettings(process.env), {
    corsOrigins: readCorsOrigins(process.env),
    migrateOnStart: readMigrateOnStart(process.env),
  });
  app.enableShutdownHooks();
  await app.listen(readPort(process.env));
}

void bootstrap();
