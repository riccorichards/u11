// Path: components/admin/ResultToast.tsx
"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cx } from "./ui";

export type ToastTone = "success" | "warning" | "error" | "info";

export interface ToastMessage {
  tone: ToastTone;
  title: string;
  /** Extra lines, e.g. "2 already had it". */
  detail?: string[];
}

interface ToastItem extends ToastMessage {
  id: number;
}

const ToastContext = createContext<{ show: (t: ToastMessage) => void } | null>(
  null,
);

const TONE_BORDER: Record<ToastTone, string> = {
  success: "#1FA97A",
  warning: "#E0A72F",
  error: "#E8735C",
  info: "#018ABE",
};

/** Wrap the admin layout in this once. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback(
    (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)),
    [],
  );
  const show = useCallback((t: ToastMessage) => {
    const id = nextId.current++;
    setToasts((ts) => [...ts.slice(-3), { ...t, id }]); // keep at most 4 on screen
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(onDismiss, toast.tone === "error" ? 10000 : 6000);
    return () => clearTimeout(timer);
  }, [paused, onDismiss, toast.tone]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto rounded-lg border border-sky/15 bg-[#0B2133] p-4 shadow-xl shadow-black/30"
      style={{ borderLeft: `4px solid ${TONE_BORDER[toast.tone]}` }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-sm font-semibold text-mist">
            {toast.title}
          </p>
          {toast.detail?.map((line, i) => (
            <p key={i} className="mt-0.5 font-body text-xs text-sky/80">
              {line}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className={cx(
            "rounded p-1 text-sky/60 hover:text-mist",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/60",
          )}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
