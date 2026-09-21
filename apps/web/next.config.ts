import type { NextConfig } from 'next';

const config: NextConfig = {
  // 워크스페이스 패키지(생성된 API 클라이언트)를 함께 번들한다.
  transpilePackages: ['@todo/api-client'],
  // 배포 커밋을 브라우저 오류에 붙여 배포별로 볼 수 있게 한다(Vercel이 빌드 때 주입).
  env: { NEXT_PUBLIC_APP_VERSION: process.env.VERCEL_GIT_COMMIT_SHA ?? '' },
};

export default config;
