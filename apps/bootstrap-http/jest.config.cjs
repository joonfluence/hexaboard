/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  // Testcontainers가 컨테이너를 시작하는 시간을 포함한다.
  testTimeout: 120000,
  // 스위트마다 Postgres 컨테이너를 띄우므로 동시에 실행하는 수를 제한한다(과다하면 시작 타임아웃).
  maxWorkers: 2,
  testMatch: ['<rootDir>/test/**/*.(spec|int-spec|api-spec).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
