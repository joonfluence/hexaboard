'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface ToastApi {
  show(message: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

interface ToastItem {
  id: number;
  message: string;
}

function ToastMessage({
  message,
  duration,
  onDone,
}: {
  message: string;
  duration: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);
  return (
    <div
      role="status"
      className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
    >
      {message}
    </div>
  );
}

/** 짧은 알림. 카드 이동 실패를 알린다(D-68). 일정 시간 뒤 사라진다. */
export function ToastProvider({
  children,
  duration = 5000,
}: {
  children: ReactNode;
  duration?: number;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string) => {
    setItems((current) => [
      ...current,
      { id: Date.now() + Math.random(), message },
    ]);
  }, []);
  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-4 bottom-4 flex flex-col gap-2">
        {items.map((item) => (
          <ToastMessage
            key={item.id}
            message={item.message}
            duration={duration}
            onDone={() =>
              setItems((current) => current.filter((i) => i.id !== item.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error('ToastProvider 안에서만 쓸 수 있습니다.');
  }
  return api;
}
