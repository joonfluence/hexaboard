/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  // Testcontainers가 컨테이너를 내려받고 시작하는 시간을 포함한다.
  testTimeout: 120000,
  testMatch: ['<rootDir>/test/**/*.(spec|int-spec|api-spec).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
