import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { DatabaseSettings } from '@todo/persistence';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

export interface AppOptions {
  /** CORS로 허용할 오리진. 비어 있으면 허용하지 않는다(브라우저가 직접 호출하는 웹 앱의 오리진). */
  corsOrigins?: readonly string[];
}

/** 앱 공통 설정. 실제 앱과 테스트 앱이 같은 설정을 쓰도록 한곳에 둔다. 모든 경로 앞에 `/v1`이 붙는다. */
export function configureApp(
  app: INestApplication,
  options: AppOptions = {},
): void {
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  if (options.corsOrigins && options.corsOrigins.length > 0) {
    app.enableCors({
      origin: [...options.corsOrigins],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type'],
    });
  }
}

/** 앱을 만든다(리슨은 호출자가 한다). */
export async function createApp(
  settings: DatabaseSettings,
  options: AppOptions = {},
): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(settings), {
    logger: ['error', 'warn'],
  });
  configureApp(app, options);
  return app;
}
