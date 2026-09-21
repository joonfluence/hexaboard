'use client';

import { createApiClient, type ApiClient } from '@todo/api-client';
import { createContext, useContext, type ReactNode } from 'react';
import { reportApiFailure } from '@/shared/observability/faro';
import { withRequestId } from './request-id';

const ApiClientContext = createContext<ApiClient | null>(null);

/** API 클라이언트를 트리에 공급한다. 테스트는 가짜 서버로 만든 클라이언트를 넣는다. */
export function ApiClientProvider({
  client,
  children,
}: {
  client: ApiClient;
  children: ReactNode;
}) {
  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('ApiClientProvider 안에서만 쓸 수 있습니다.');
  }
  return client;
}

/** 브라우저가 서버를 직접 호출한다. 주소는 환경변수로 받는다(`.env.example` 참조). */
export function createBrowserApiClient(): ApiClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new Error('환경변수 NEXT_PUBLIC_API_BASE_URL이 필요합니다.');
  }
  return createApiClient(
    baseUrl,
    withRequestId(
      (request) => fetch(request),
      (failure) => {
        void reportApiFailure(failure);
      },
    ),
  );
}
