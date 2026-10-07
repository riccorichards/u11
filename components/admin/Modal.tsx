// Path: components/admin/Modal.tsx
"use client";

import { ReactNode, useEffect, useId, useRef } from "react";
import { cx } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-lg",
}: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([data-close])",
    );
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          "relative w-full rounded-lg border border-sky/15 bg-[#0B2133] shadow-2xl shadow-black/40",
          width,
        )}
      >
        <div className="flex items-center justify-between border-b border-sky/10 px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-bold text-mist">
            {title}
          </h2>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-sky/60 hover:text-mist focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/60"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M2 2l10 10M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-sky/10 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
