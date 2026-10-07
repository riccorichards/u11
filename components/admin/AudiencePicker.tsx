// Path: components/admin/AudiencePicker.tsx
"use client";

import { useId } from "react";
import {
  POSITIONS,
  POSITION_COLOR,
  POSITION_LABEL,
  Position,
  cx,
  plural,
  ui,
} from "./ui";
import { useGroups, usePlayers } from "./useAdminData";
import PlayerMultiSelect from "./PlayerMultiSelect";

export type AudienceValue =
  | { type: "TEAM" }
  | { type: "POSITION"; position: Position | null }
  | { type: "GROUP"; groupId: string | null }
  | { type: "PLAYER"; playerIds: string[] };

export const DEFAULT_AUDIENCE: AudienceValue = { type: "TEAM" };

/** False while the coach still has to pick a position, group or players. */
export function isAudienceComplete(v: AudienceValue): boolean {
  if (v.type === "POSITION") return v.position !== null;
  if (v.type === "GROUP") return v.groupId !== null;
  if (v.type === "PLAYER") return v.playerIds.length > 0;
  return true;
}

/** The `audience` object the API expects, or null if incomplete. */
export function toApiAudience(v: AudienceValue) {
  if (!isAudienceComplete(v)) return null;
  switch (v.type) {
    case "TEAM":
      return { type: "TEAM" };
    case "POSITION":
      return { type: "POSITION", position: v.position };
    case "GROUP":
      return { type: "GROUP", groupId: v.groupId };
    case "PLAYER":
      return { type: "PLAYER", playerIds: v.playerIds };
  }
}

const MODES: { type: AudienceValue["type"]; label: string }[] = [
  { type: "TEAM", label: "Whole team" },
  { type: "POSITION", label: "Position" },
  { type: "GROUP", label: "Group" },
  { type: "PLAYER", label: "Players" },
];

function emptyFor(type: AudienceValue["type"]): AudienceValue {
  if (type === "POSITION") return { type, position: null };
  if (type === "GROUP") return { type, groupId: null };
  if (type === "PLAYER") return { type, playerIds: [] };
  return { type: "TEAM" };
}

interface Props {
  value: AudienceValue;
  onChange: (value: AudienceValue) => void;
  label?: string;
  disabled?: boolean;
}

export default function AudiencePicker({
  value,
  onChange,
  label = "Who gets this",
  disabled = false,
}: Props) {
  const players = usePlayers();
  const groups = useGroups();
  const name = useId();
  const roster = players.data ?? [];
  const activeGroups = (groups.data ?? []).filter((g) => !g.isArchived);

  let count: number | null = null;
  if (value.type === "TEAM") count = roster.length;
  if (value.type === "POSITION" && value.position)
    count = roster.filter((p) => p.position === value.position).length;
  if (value.type === "GROUP" && value.groupId) {
    count =
      activeGroups.find((g) => g._id === value.groupId)?.playerIds.length ?? 0;
  }
  if (value.type === "PLAYER") count = value.playerIds.length;

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className={ui.label}>{label}</legend>

      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {MODES.map((m) => (
          <label
            key={m.type}
            className={cx(ui.chip(value.type === m.type), "cursor-pointer")}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={value.type === m.type}
              onChange={() => onChange(emptyFor(m.type))}
            />
            {m.label}
          </label>
        ))}
      </div>

      <div className="mt-3">
        {value.type === "TEAM" && (
          <p className={ui.hint}>Every player on the roster, as of today.</p>
        )}

        {value.type === "POSITION" && (
          <div
            role="radiogroup"
            aria-label="Position"
            className="flex flex-wrap gap-2"
          >
            {POSITIONS.map((p) => {
              const active = value.position === p;
              return (
                <label
                  key={p}
                  className={cx(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 font-body text-sm transition",
                    active
                      ? "border-transparent bg-white/[0.08] text-mist"
                      : "border-sky/20 text-sky/70 hover:text-mist",
                  )}
                  style={
                    active
                      ? { boxShadow: `inset 0 0 0 1.5px ${POSITION_COLOR[p]}` }
                      : undefined
                  }
                >
                  <input
                    type="radio"
                    name={`${name}-position`}
                    className="sr-only"
                    checked={active}
                    onChange={() => onChange({ type: "POSITION", position: p })}
                  />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: POSITION_COLOR[p] }}
                    aria-hidden
                  />
                  {POSITION_LABEL[p]}
                </label>
              );
            })}
          </div>
        )}

        {value.type === "GROUP" && (
          <>
            {groups.loading && <p className={ui.hint}>Loading groups…</p>}
            {groups.error && (
              <p className={ui.error}>
                Couldn&apos;t load groups: {groups.error}
              </p>
            )}
            {!groups.loading && !groups.error && activeGroups.length === 0 && (
              <p className={ui.hint}>
                No groups yet. Create one on the Groups page.
              </p>
            )}
            <div
              role="radiogroup"
              aria-label="Group"
              className="flex flex-col gap-1"
            >
              {activeGroups.map((g) => {
                const active = value.groupId === g._id;
                return (
                  <label
                    key={g._id}
                    className={cx(
                      "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition",
                      active
                        ? "bg-ocean/10 ring-1 ring-ocean/50"
                        : "hover:bg-white/[0.03]",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${name}-group`}
                      className="sr-only"
                      checked={active}
                      onChange={() =>
                        onChange({ type: "GROUP", groupId: g._id })
                      }
                    />
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: g.color }}
                      aria-hidden
                    />
                    <span className="flex-1 font-body text-sm text-mist">
                      {g.name}
                    </span>
                    <span className={ui.hint}>
                      {plural(g.playerIds.length, "player")}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}

        {value.type === "PLAYER" && (
          <PlayerMultiSelect
            label="Pick players"
            value={value.playerIds}
            onChange={(playerIds) => onChange({ type: "PLAYER", playerIds })}
            players={players.data ?? undefined}
          />
        )}
      </div>

      {count !== null && (
        <p
          className={cx(
            "mt-3 font-body text-sm",
            count === 0 ? "text-[#E8735C]" : "text-sky/80",
          )}
          aria-live="polite"
        >
          {count === 0
            ? "No players in this selection yet."
            : `Goes to ${plural(count, "player")}.`}
        </p>
      )}
    </fieldset>
  );
}
