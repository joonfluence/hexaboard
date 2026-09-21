import type { DatabaseSettings } from '@todo/persistence';

type Env = Readonly<Record<string, string | undefined>>;

function required(env: Env, name: string): string {
  const value = env[name];
  if (value === undefined || value === '') {
    throw new Error(`환경변수 ${name}이(가) 필요합니다. (.env.example 참조)`);
  }
  return value;
}

function requiredPort(env: Env, name: string): number {
  const raw = required(env, name);
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(
      `환경변수 ${name}은(는) 올바른 포트 번호여야 합니다: ${raw}`,
    );
  }
  return port;
}

/** DB 접속 정보는 환경변수에서만 읽는다. 저장소에는 값을 두지 않는다. */
export function readDatabaseSettings(env: Env): DatabaseSettings {
  return {
    host: required(env, 'DATABASE_HOST'),
    port: requiredPort(env, 'DATABASE_PORT'),
    dbName: required(env, 'DATABASE_NAME'),
    user: required(env, 'DATABASE_USER'),
    password: required(env, 'DATABASE_PASSWORD'),
    ssl: env['DATABASE_SSL'] === 'true',
  };
}

export function readPort(env: Env): number {
  return requiredPort(env, 'PORT');
}

/** CORS로 허용할 오리진(쉼표 구분). 비어 있거나 없으면 어떤 오리진도 허용하지 않는다. */
export function readCorsOrigins(env: Env): string[] {
  return (env['CORS_ALLOWED_ORIGINS'] ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/** 기동 시 마이그레이션 실행 여부. 기본은 실행한다(D-72). `false`면 배포 전 단계(`migrate`)에서 따로 실행한다. */
export function readMigrateOnStart(env: Env): boolean {
  return env['MIGRATE_ON_START'] !== 'false';
}
