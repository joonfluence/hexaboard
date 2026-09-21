'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiClientProvider, createBrowserApiClient } from '@/shared/api/client';
import { initObservability } from '@/shared/observability/faro';
import { ToastProvider } from '@/shared/ui/toast';

/** 앱 전역 공급자. 서버 상태(TanStack Query), API 클라이언트, 토스트. */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(initObservability, []);
  const [client] = useState(createBrowserApiClient);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <ApiClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </ApiClientProvider>
  );
}
