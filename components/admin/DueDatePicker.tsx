// Path: components/admin/DueDatePicker.tsx
"use client";

import { useId } from "react";
import { cx, ui } from "./ui";

/** "2026-10-14" → the last millisecond of that day in the coach's time zone, as ISO. */
export function endOfLocalDayISO(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

/** ISO → "2026-10-14" in local time, for <input type="date">. */
export function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysInput(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoToDateInput(d.toISOString());
}

const QUICK: { label: string; days: number | null }[] = [
  { label: "Today", days: 0 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
  { label: "No due date", days: null },
];

interface Props {
  value: string | null;
  onChange: (iso: string | null) => void;
  label?: string;
  allowPast?: boolean;
  disabled?: boolean;
  error?: string | null;
}

export default function DueDatePicker({
  value,
  onChange,
  label = "Due date",
  allowPast = false,
  disabled = false,
  error,
}: Props) {
  const id = useId();
  const inputValue = isoToDateInput(value);
  const today = addDaysInput(0);

  function setFromInput(v: string) {
    onChange(v ? endOfLocalDayISO(v) : null);
  }

  const readable = value
    ? new Date(value).toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : null;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={ui.label}>
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="date"
          value={inputValue}
          min={allowPast ? undefined : today}
          disabled={disabled}
          onChange={(e) => setFromInput(e.target.value)}
          className={cx(
            ui.input,
            "w-auto [color-scheme:dark]",
            error && "border-[#E8735C]",
          )}
        />
        {QUICK.map((q) => {
          const target = q.days === null ? "" : addDaysInput(q.days);
          const active = inputValue === target;
          return (
            <button
              key={q.label}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => setFromInput(target)}
              className={cx(ui.chip(active), ui.focus, "px-2.5 py-1 text-xs")}
            >
              {q.label}
            </button>
          );
        })}
      </div>
      {error ? (
        <p className={cx(ui.error, "mt-1")}>{error}</p>
      ) : (
        <p className={cx(ui.hint, "mt-1")}>
          {readable
            ? `Due by the end of ${readable}.`
            : "No deadline. Players can finish it any time."}
        </p>
      )}
    </div>
  );
}
