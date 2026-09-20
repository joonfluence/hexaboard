import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { DatabaseSettings } from '@todo/persistence';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/** 앱 공통 설정. 실제 앱과 테스트 앱이 같은 설정을 쓰도록 한곳에 둔다. 모든 경로 앞에 `/v1`이 붙는다. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new AllExceptionsFilter());
}

/** 앱을 만든다(리슨은 호출자가 한다). */
export async function createApp(
  settings: DatabaseSettings,
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(settings), {
    logger: ['error', 'warn'],
  });
  configureApp(app);
  return app;
}
