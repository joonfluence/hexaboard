import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TICKET_REPOSITORY, type TicketRepository } from '@todo/application';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import type { DatabaseSettings } from '@todo/persistence';
import { AppModule } from '../../src/app.module';
import { configureApp, createApp } from '../../src/app.factory';

/** 로컬 docker-compose.yml의 이미지와 같은 메이저 버전을 쓴다. */
export const POSTGRES_IMAGE = 'postgres:18';

export const settingsOf = (
  container: StartedPostgreSqlContainer,
): DatabaseSettings => ({
  host: container.getHost(),
  port: container.getPort(),
  dbName: container.getDatabase(),
  user: container.getUsername(),
  password: container.getPassword(),
});

/** 컨테이너 안에서 SQL을 실행하고 결과 문자열을 돌려준다(별도 DB 클라이언트 의존성 없음). */
export async function psql(
  container: StartedPostgreSqlContainer,
  sql: string,
): Promise<string> {
  const result = await container.exec([
    'psql',
    '-U',
    container.getUsername(),
    '-d',
    container.getDatabase(),
    '-tAc',
    sql,
  ]);
  if (result.exitCode !== 0) {
    throw new Error(`psql 실패: ${result.output}`);
  }
  return result.output.trim();
}

export interface TestApp {
  app: INestApplication;
  baseUrl: string;
  container: StartedPostgreSqlContainer;
  sql(statement: string): Promise<string>;
  /** 모든 티켓을 지우고 시퀀스를 초기화한다. */
  reset(): Promise<void>;
  stop(): Promise<void>;
}

export interface TestAppOptions {
  /** 저장소를 테스트 대역으로 바꾼다(예: 동시 생성 충돌을 재현). 생략하면 실제 저장소를 쓴다. */
  repository?: TicketRepository;
  /** CORS로 허용할 오리진. 생략하면 허용하지 않는다. */
  corsOrigins?: string[];
}

/** Testcontainers Postgres 위에 실제 Nest 앱을 띄운다. Docker가 없으면 시작 단계에서 실패한다. */
export async function startTestApp(
  options: TestAppOptions = {},
): Promise<TestApp> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const settings = settingsOf(container);
  let app: INestApplication;
  if (options.repository) {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forRoot(settings)],
    })
      .overrideProvider(TICKET_REPOSITORY)
      .useValue(options.repository)
      .compile();
    app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });
    configureApp(app, { corsOrigins: options.corsOrigins });
    await app.init();
  } else {
    app = await createApp(settings, { corsOrigins: options.corsOrigins });
  }
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  return {
    app,
    baseUrl,
    container,
    sql: (statement) => psql(container, statement),
    reset: async () => {
      await psql(
        container,
        'truncate table ticket, tag restart identity cascade',
      );
    },
    stop: async () => {
      await app.close();
      await container.stop();
    },
  };
}
