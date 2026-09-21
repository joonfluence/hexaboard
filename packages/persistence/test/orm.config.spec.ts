import { createOrmConfig } from '../src/orm.config';

const base = {
  host: 'localhost',
  port: 5432,
  dbName: 'todo',
  user: 'todo',
  password: 'secret',
};

describe('ORM 설정의 SSL', () => {
  it('ssl을 켜면 pg 풀 옵션으로 ssl을 전달한다(pg의 `connection` 키를 쓰면 안 된다)', () => {
    const config = createOrmConfig({ ...base, ssl: true });
    expect(config.driverOptions).toEqual({ ssl: true });
  });

  it('ssl을 켜지 않으면 driverOptions를 두지 않는다', () => {
    expect(createOrmConfig(base).driverOptions).toBeUndefined();
    expect(
      createOrmConfig({ ...base, ssl: false }).driverOptions,
    ).toBeUndefined();
  });
});
