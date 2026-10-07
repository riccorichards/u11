// Path: components/player/theme.ts

import type { AssignmentStatus, ProgressStatus } from "./types";

export const PROGRESS_COLOR: Record<ProgressStatus, string> = {
  LOCKED: "#4A5D6B",
  OPEN: "#5FB4C9",
  IN_PROGRESS: "#E0A72F",
  MASTERED: "#1FA97A",
};

export const ASSIGNMENT_COLOR: Record<AssignmentStatus, string> = {
  ASSIGNED: "#5FB4C9",
  IN_PROGRESS: "#E0A72F",
  PASSED: "#1FA97A",
  NOT_YET: "#E8735C",
  EXPIRED: "#6B7F8C",
};

export const playerCard = "rounded-2xl border border-white/10 bg-white/[0.04]";
export const playerFocus =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/70";
export const bigButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 font-body text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean/70";
