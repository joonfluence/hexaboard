import {
  readCorsOrigins,
  readDatabaseSettings,
  readMigrateOnStart,
  readPort,
} from '../src/config';

const env = {
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5432',
  DATABASE_NAME: 'todo',
  DATABASE_USER: 'todo',
  DATABASE_PASSWORD: 'secret',
  PORT: '3000',
};

describe('환경변수 설정', () => {
  it('DB 접속 정보를 읽는다. 포트는 숫자로 변환한다', () => {
    expect(readDatabaseSettings(env)).toEqual({
      host: 'localhost',
      port: 5432,
      dbName: 'todo',
      user: 'todo',
      password: 'secret',
      ssl: false,
    });
  });

  it.each(Object.keys(env).filter((key) => key !== 'PORT'))(
    '%s가 없으면 어떤 변수가 빠졌는지 알려 주며 실패한다',
    (name) => {
      const rest: Record<string, string> = { ...env };
      delete rest[name];
      expect(() => readDatabaseSettings(rest)).toThrow(name);
    },
  );

  it('빈 문자열은 없는 것으로 본다(.env.example처럼 값이 비어 있는 경우)', () => {
    expect(() => readDatabaseSettings({ ...env, DATABASE_HOST: '' })).toThrow(
      'DATABASE_HOST',
    );
  });

  it('숫자가 아닌 포트는 거부한다', () => {
    expect(() =>
      readDatabaseSettings({ ...env, DATABASE_PORT: 'abc' }),
    ).toThrow('DATABASE_PORT');
    expect(() => readPort({ PORT: 'abc' })).toThrow('PORT');
  });

  it('서버 포트를 읽는다', () => {
    expect(readPort(env)).toBe(3000);
  });
});

describe('CORS 허용 오리진 설정', () => {
  it('TC-RUN-010: 쉼표로 나눠 공백을 제거해 읽고, 비어 있거나 없으면 빈 목록이다', () => {
    expect(
      readCorsOrigins({
        CORS_ALLOWED_ORIGINS:
          ' http://localhost:3100 , https://app.example.com ,',
      }),
    ).toEqual(['http://localhost:3100', 'https://app.example.com']);
    expect(readCorsOrigins({ CORS_ALLOWED_ORIGINS: '' })).toEqual([]);
    expect(readCorsOrigins({})).toEqual([]);
  });
});

describe('DB SSL·마이그레이션 실행 설정', () => {
  it('DATABASE_SSL=true일 때만 SSL을 켠다', () => {
    expect(readDatabaseSettings(env).ssl).toBe(false);
    expect(readDatabaseSettings({ ...env, DATABASE_SSL: 'true' }).ssl).toBe(
      true,
    );
    expect(readDatabaseSettings({ ...env, DATABASE_SSL: 'false' }).ssl).toBe(
      false,
    );
  });

  it('MIGRATE_ON_START는 기본 실행이고 false일 때만 건너뛴다', () => {
    expect(readMigrateOnStart({})).toBe(true);
    expect(readMigrateOnStart({ MIGRATE_ON_START: 'true' })).toBe(true);
    expect(readMigrateOnStart({ MIGRATE_ON_START: 'false' })).toBe(false);
  });
});
