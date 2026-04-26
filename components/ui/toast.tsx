'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
};

type ToastCtx = {
  push: (t: Omit<Toast, 'id'>) => void;
};

const Ctx = React.createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto rounded-md border-2 p-4 shadow-lg animate-fade-in',
              t.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground',
              t.variant === 'success' && 'border-emerald-700 bg-emerald-600 text-white',
              (!t.variant || t.variant === 'default') && 'border-santafe-navy bg-santafe-cream text-santafe-navy',
            )}
          >
            {t.title && <div className="text-sm font-bold uppercase tracking-wide">{t.title}</div>}
            {t.description && <div className="mt-1 text-sm">{t.description}</div>}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useToast precisa estar dentro do ToastProvider');
  return ctx;
}
