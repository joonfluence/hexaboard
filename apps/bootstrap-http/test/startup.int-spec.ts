import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { runMigrations } from '@todo/persistence';
import { createApp } from '../src/app.factory';
import { POSTGRES_IMAGE, psql, settingsOf } from './helpers/app';

describe('기동 시 마이그레이션 (D-72)', () => {
  let container: StartedPostgreSqlContainer;

  beforeEach(async () => {
    container = await new PostgreSqlContainer(POSTGRES_IMAGE).start();
  });
  afterEach(async () => {
    await container.stop();
  });

  it('기동하면 마이그레이션이 적용되어 ticket 테이블이 생긴다', async () => {
    const app = await createApp(settingsOf(container));
    try {
      await app.init();
      expect(
        await psql(
          container,
          "select to_regclass('public.ticket') is not null",
        ),
      ).toBe('t');
    } finally {
      await app.close();
    }
  });

  it('마이그레이션이 실패하면 기동이 중단된다', async () => {
    // 같은 이름의 테이블이 이미 있어 create table이 실패하는 상황
    await psql(container, 'create table ticket (x int)');

    const app = await createApp(settingsOf(container));
    try {
      await expect(app.init()).rejects.toThrow();
    } finally {
      await app.close().catch(() => undefined);
    }
  });

  it('migrateOnStart가 false면 기동해도 마이그레이션을 적용하지 않는다', async () => {
    const app = await createApp(settingsOf(container), {
      migrateOnStart: false,
    });
    try {
      await app.init();
      expect(
        await psql(
          container,
          "select to_regclass('public.ticket') is not null",
        ),
      ).toBe('f');
    } finally {
      await app.close();
    }
  });

  it('runMigrations는 서버 없이 마이그레이션을 적용한다', async () => {
    await runMigrations(settingsOf(container));
    expect(
      await psql(container, "select to_regclass('public.ticket') is not null"),
    ).toBe('t');
  });
});
