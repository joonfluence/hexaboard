import { MikroORM } from '@mikro-orm/postgresql';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { createOrmConfig } from '../../src/orm.config';

/** 로컬 docker-compose.yml의 이미지와 같은 메이저 버전을 쓴다. */
export const POSTGRES_IMAGE = 'postgres:18';

export interface TestDatabase {
  container: StartedPostgreSqlContainer;
  orm: MikroORM;
  /** 모든 티켓을 지우고 식별자 시퀀스를 초기화한다. */
  reset(): Promise<void>;
  stop(): Promise<void>;
}

/** Testcontainers로 실제 Postgres를 띄우고 마이그레이션을 적용한다. Docker가 없으면 시작 단계에서 실패한다. */
export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  const orm = await MikroORM.init(
    createOrmConfig({
      host: container.getHost(),
      port: container.getPort(),
      dbName: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    }),
  );
  await orm.migrator.up();

  return {
    container,
    orm,
    async reset() {
      await orm.em
        .getConnection()
        .execute('truncate table ticket, tag restart identity cascade');
    },
    async stop() {
      await orm.close(true);
      await container.stop();
    },
  };
}
