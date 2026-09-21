import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createApiClient } from '@todo/api-client';
import type { ReactElement } from 'react';
import { ApiClientProvider } from '@/shared/api/client';
import { ToastProvider } from '@/shared/ui/toast';
import type { FakeServer } from './fake-server';

/** 가짜 서버를 연결한 API 클라이언트·쿼리·토스트 위에 렌더링한다. 요청 재시도는 끈다. */
export function renderWithApp(ui: ReactElement, server: FakeServer) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const client = createApiClient('http://api.test', server.fetch);
  return render(
    <ApiClientProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{ui}</ToastProvider>
      </QueryClientProvider>
    </ApiClientProvider>,
  );
}
