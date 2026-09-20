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
  };
}

export function readPort(env: Env): number {
  return requiredPort(env, 'PORT');
}
