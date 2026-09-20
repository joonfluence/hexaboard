import type { INestApplication } from '@nestjs/common';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import type { DatabaseSettings } from '@todo/persistence';
import { createApp } from '../../src/app.factory';

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

/** Testcontainers Postgres 위에 실제 Nest 앱을 띄운다. Docker가 없으면 시작 단계에서 실패한다. */
export async function startTestApp(): Promise<TestApp> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const app = await createApp(settingsOf(container));
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  return {
    app,
    baseUrl,
    container,
    sql: (statement) => psql(container, statement),
    reset: async () => {
      await psql(container, 'truncate table ticket restart identity');
    },
    stop: async () => {
      await app.close();
      await container.stop();
    },
  };
}
