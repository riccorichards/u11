// Path: components/admin/PlayerMultiSelect.tsx
"use client";

import { useId, useMemo, useState } from "react";
import { PlayerOption, usePlayers } from "./useAdminData";
import { cx, Position, POSITION_COLOR, POSITIONS, ui } from "./ui";

interface Props {
  value: string[];
  onChange: (playerIds: string[]) => void;
  /** Pass players if the page already has them; otherwise they're loaded from /api/players. */
  players?: PlayerOption[];
  label?: string;
  disabled?: boolean;
  /** Tailwind max-height class for the scrolling list. */
  listHeight?: string;
}

export default function PlayerMultiSelect({
  value,
  onChange,
  players: playersProp,
  label = "Players",
  disabled = false,
  listHeight = "max-h-72",
}: Props) {
  const loaded = usePlayers();
  const players = playersProp ?? loaded.data ?? [];
  const loading = !playersProp && loaded.loading;
  const error = !playersProp ? loaded.error : null;

  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<Position | "ALL">("ALL");
  const searchId = useId();
  const selected = useMemo(() => new Set(value), [value]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...players]
      .sort((a, b) => a.number - b.number)
      .filter((p) => position === "ALL" || p.position === position)
      .filter(
        (p) =>
          !q ||
          `${p.name} ${p.surname}`.toLowerCase().includes(q) ||
          String(p.number) === q,
      );
  }, [players, query, position]);

  function toggle(id: string) {
    onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  function selectAllVisible() {
    const next = new Set(value);
    visible.forEach((p) => next.add(p._id));
    onChange([...next]);
  }

  const allVisibleSelected =
    visible.length > 0 && visible.every((p) => selected.has(p._id));

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={ui.label}>{label}</legend>

      <div className="flex flex-wrap items-center gap-2">
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or number"
          aria-label="Search players"
          className={cx(ui.input, "flex-1 basis-48")}
        />
        <div
          className="flex gap-1"
          role="group"
          aria-label="Filter by position"
        >
          {(["ALL", ...POSITIONS] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPosition(p)}
              aria-pressed={position === p}
              className={cx(
                ui.chip(position === p),
                ui.focus,
                "px-2.5 py-1 text-xs",
              )}
            >
              {p === "ALL" ? "All" : p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className={ui.hint} aria-live="polite">
          {value.length} selected
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={selectAllVisible}
            disabled={allVisibleSelected}
            className={cx(ui.textButton, ui.focus)}
          >
            Select{" "}
            {position === "ALL" && !query ? "all" : `these ${visible.length}`}
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={value.length === 0}
            className={cx(ui.textButton, ui.focus)}
          >
            Clear
          </button>
        </div>
      </div>

      <div
        className={cx(
          "mt-2 overflow-y-auto rounded-md border border-sky/10",
          listHeight,
        )}
      >
        {loading && <p className={cx(ui.hint, "p-4")}>Loading players…</p>}
        {error && (
          <p className={cx(ui.error, "p-4")}>
            Couldn&apos;t load players: {error}
          </p>
        )}
        {!loading && !error && players.length === 0 && (
          <p className={cx(ui.hint, "p-4")}>
            No players yet. Add players on the Roster page first.
          </p>
        )}
        {!loading && !error && players.length > 0 && visible.length === 0 && (
          <p className={cx(ui.hint, "p-4")}>No players match this search.</p>
        )}
        <ul>
          {visible.map((p) => {
            const checked = selected.has(p._id);
            return (
              <li key={p._id}>
                <label
                  className={cx(
                    "flex cursor-pointer items-center gap-3 px-3 py-2 transition",
                    checked ? "bg-ocean/10" : "hover:bg-white/[0.03]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p._id)}
                    className="h-4 w-4 accent-[#018ABE]"
                  />
                  <span
                    className="flex h-6 w-7 shrink-0 items-center justify-center rounded font-display text-xs font-bold text-white"
                    style={{ backgroundColor: POSITION_COLOR[p.position] }}
                    aria-hidden
                  >
                    {p.number}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-body text-sm text-mist">
                    {p.name} {p.surname}
                  </span>
                  <span className="font-body text-xs text-sky/60">
                    {p.position}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </fieldset>
  );
}
