import type { NextConfig } from 'next';

const config: NextConfig = {
  // 워크스페이스 패키지(생성된 API 클라이언트)를 함께 번들한다.
  transpilePackages: ['@todo/api-client'],
};

export default config;
