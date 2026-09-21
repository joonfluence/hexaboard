import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

// 서버 주소(NEXT_PUBLIC_API_BASE_URL)는 실행 시점에 읽으므로 빌드 때 미리 렌더링하지 않는다.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '티켓 보드',
  description: '상태별로 티켓을 관리하는 보드',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
