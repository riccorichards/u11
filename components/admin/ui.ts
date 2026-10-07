// Path: components/admin/ui.ts

/** Shared tokens for the admin components. Change colors here, not in each file. */

export const POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_COLOR: Record<Position, string> = {
  GK: "#E0A72F",
  DEF: "#018ABE",
  MID: "#1FA97A",
  FWD: "#E8735C",
};

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Goalkeepers",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
};

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const ui = {
  focus: "focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/60",
  label: "mb-1.5 block font-body text-xs font-medium text-sky/80",
  hint: "font-body text-xs text-sky/60",
  error: "font-body text-xs text-[#E8735C]",
  input:
    "w-full rounded-md border border-sky/20 bg-white/[0.03] px-3 py-2 font-body text-sm text-mist placeholder:text-sky/40 focus:border-ocean focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/40 disabled:opacity-50",
  // Dropdowns need an opaque background. Swap this hex for your page background token if you have one.
  panel:
    "rounded-lg border border-sky/15 bg-[#0B2133] shadow-xl shadow-black/30",
  chip: (active: boolean) =>
    cx(
      "rounded-md px-3 py-1.5 font-body text-sm transition",
      active
        ? "bg-ocean text-white"
        : "border border-sky/20 text-sky/70 hover:border-sky/40 hover:text-mist",
    ),
  textButton:
    "font-body text-xs text-sky/70 underline-offset-2 hover:text-mist hover:underline disabled:opacity-40",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-body text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/60";

export const button = {
  primary: `${BUTTON_BASE} bg-ocean text-white hover:bg-[#0299d1]`,
  secondary: `${BUTTON_BASE} border border-sky/20 text-sky/80 hover:border-sky/40 hover:text-mist`,
  danger: `${BUTTON_BASE} border border-[#E8735C]/40 text-[#E8735C] hover:bg-[#E8735C]/10`,
  small: "px-3 py-1.5 text-xs",
};

export const card = "rounded-lg border border-sky/10 bg-white/[0.02]";

export const TASK_TYPE_LABEL: Record<string, string> = {
  PUZZLE: "Puzzle",
  FIELD_CHECK: "Field check",
  CHALLENGE: "Challenge",
};

export const ASSIGNMENT_STATUS: Record<
  string,
  { label: string; color: string }
> = {
  ASSIGNED: { label: "Assigned", color: "#8FB8CC" },
  IN_PROGRESS: { label: "In progress", color: "#E0A72F" },
  PASSED: { label: "Passed", color: "#1FA97A" },
  NOT_YET: { label: "Not yet", color: "#E8735C" },
  EXPIRED: { label: "Expired", color: "#6B7F8C" },
};

export const PROGRESS_STATUS: Record<string, { label: string; color: string }> =
  {
    LOCKED: { label: "Locked", color: "#4A5D6B" },
    OPEN: { label: "Open", color: "#8FB8CC" },
    IN_PROGRESS: { label: "In progress", color: "#E0A72F" },
    MASTERED: { label: "Mastered", color: "#1FA97A" },
  };

export const BADGE_SOURCE_LABEL: Record<string, string> = {
  TASK: "Task badge",
  BRANCH: "Branch badge",
  MANUAL: "Coach badge",
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function playerName(
  p: { name: string; surname: string } | null | undefined,
): string {
  return p ? `${p.name} ${p.surname}` : "Removed player";
}
