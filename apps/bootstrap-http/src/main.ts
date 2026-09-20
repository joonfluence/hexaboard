import 'reflect-metadata';
import { createApp } from './app.factory';
import { readDatabaseSettings, readPort } from './config';

async function bootstrap(): Promise<void> {
  const app = await createApp(readDatabaseSettings(process.env));
  app.enableShutdownHooks();
  await app.listen(readPort(process.env));
}

void bootstrap();
