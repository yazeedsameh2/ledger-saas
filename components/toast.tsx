"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type ToastItem = {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  show: (message: string, opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let nextId = 0;

  const show = useCallback(
    (message: string, opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, opts?.duration ?? 4200);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[300] flex w-full -translate-x-1/2 flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3.5 rounded bg-[var(--ink)] px-4 py-2.5 text-[13px] text-[var(--paper)] shadow-lg animate-[toastIn_200ms_ease]"
          >
            <span>{t.message}</span>
            {t.actionLabel && (
              <button
                className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)]"
                onClick={() => {
                  t.onAction?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
