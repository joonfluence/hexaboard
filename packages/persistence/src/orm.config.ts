import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { Migration20260921000000 } from './migrations/Migration20260921000000';
import { TicketSchema } from './ticket.entity';

export interface DatabaseSettings {
  host: string;
  port: number;
  dbName: string;
  user: string;
  password: string;
}

/** ORM 설정. 마이그레이션은 파일 탐색 대신 목록으로 등록한다. */
export function createOrmConfig(settings: DatabaseSettings) {
  return defineConfig({
    ...settings,
    entities: [TicketSchema],
    extensions: [Migrator],
    forceUtcTimezone: true,
    migrations: {
      migrationsList: [
        {
          name: 'Migration20260921000000',
          class: Migration20260921000000,
        },
      ],
      transactional: true,
      snapshot: false,
    },
  });
}
