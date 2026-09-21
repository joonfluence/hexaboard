import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { DatabaseSettings } from '@todo/persistence';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { requestLogging, type AccessLogEntry } from './common/request-logging';

export interface AppOptions {
  /** CORS로 허용할 오리진. 비어 있으면 허용하지 않는다(브라우저가 직접 호출하는 웹 앱의 오리진). */
  corsOrigins?: readonly string[];
  /** false면 기동 시 마이그레이션을 건너뛴다. 기본은 실행한다(D-72). */
  migrateOnStart?: boolean;
  /** 접근 로그를 받을 곳. 생략하면 기록하지 않는다(테스트가 조용하도록). 실제 앱은 JSON 줄을 표준 출력에 쓴다. */
  accessLog?: (entry: AccessLogEntry) => void;
}

/** 앱 공통 설정. 실제 앱과 테스트 앱이 같은 설정을 쓰도록 한곳에 둔다. `/health`를 뺀 모든 경로 앞에 `/v1`이 붙는다. */
export function configureApp(
  app: INestApplication,
  options: AppOptions = {},
): void {
  if (options.accessLog) {
    app.use(requestLogging(options.accessLog));
  }
  app.setGlobalPrefix('v1', { exclude: ['health'] });
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
  const app = await NestFactory.create(
    AppModule.forRoot(settings, {
      migrateOnStart: options.migrateOnStart,
    }),
    {
      logger: ['error', 'warn'],
    },
  );
  configureApp(app, options);
  return app;
}
