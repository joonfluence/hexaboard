import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { DatabaseSettings } from '@todo/persistence';
import { AppModule } from './app.module';

/** 앱을 만든다(리슨은 호출자가 한다). 모든 경로 앞에 `/v1`이 붙는다. */
export async function createApp(
  settings: DatabaseSettings,
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(settings), {
    logger: ['error', 'warn'],
  });
  app.setGlobalPrefix('v1');
  return app;
}
