import { runMigrations } from '@todo/persistence';
import { readDatabaseSettings } from './config';

/** 배포 전 단계에서 마이그레이션만 적용하고 끝나는 진입점. 실패하면 0이 아닌 코드로 종료한다. */
runMigrations(readDatabaseSettings(process.env)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
