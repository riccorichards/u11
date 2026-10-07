// Path: components/admin/resultMessages.ts

/**
 * Turns API responses into toast messages, so every screen describes results
 * the same way. Use with useToast().show(...).
 */

import type { ToastMessage } from "./ResultToast";
import { plural } from "./ui";

interface Warning {
  playerId: string;
  missing: { nodeId: string; title: string }[];
}

interface OpenResult {
  opened: number;
  alreadyOpen: number;
  warnings: Warning[];
}

interface Rewards {
  xp: number;
  badge: { title: string } | null;
}

function prerequisiteLine(warnings: Warning[]): string[] {
  if (warnings.length === 0) return [];
  const titles = [
    ...new Set(warnings.flatMap((w) => w.missing.map((m) => m.title))),
  ];
  return [
    `${plural(warnings.length, "player")} haven't mastered ${titles.join(", ")} yet.`,
  ];
}

export function openTopicMessage(r: OpenResult): ToastMessage {
  const detail = [
    ...(r.alreadyOpen > 0 ? [`${r.alreadyOpen} already had it open.`] : []),
    ...prerequisiteLine(r.warnings),
  ];
  return {
    tone: r.warnings.length > 0 ? "warning" : "success",
    title:
      r.opened > 0
        ? `Topic opened for ${plural(r.opened, "player")}`
        : "Everyone already had this topic open",
    detail,
  };
}

export function assignMessage(r: {
  assigned: number;
  alreadyAssigned: number;
  topic: OpenResult;
}): ToastMessage {
  const detail = [
    ...(r.alreadyAssigned > 0 ? [`${r.alreadyAssigned} already had it.`] : []),
    ...(r.topic.opened > 0
      ? [`Topic opened for ${plural(r.topic.opened, "player")}.`]
      : []),
    ...prerequisiteLine(r.topic.warnings),
  ];
  return {
    tone: r.topic.warnings.length > 0 ? "warning" : "success",
    title:
      r.assigned > 0
        ? `Assigned to ${plural(r.assigned, "player")}`
        : "Everyone already has this task",
    detail,
  };
}

export function awardMessage(
  r: { awarded: string[]; alreadyHad: string[] },
  badgeTitle: string,
): ToastMessage {
  return {
    tone: r.awarded.length > 0 ? "success" : "info",
    title:
      r.awarded.length > 0
        ? `“${badgeTitle}” awarded to ${plural(r.awarded.length, "player")}`
        : `Everyone already has “${badgeTitle}”`,
    detail:
      r.alreadyHad.length > 0 && r.awarded.length > 0
        ? [`${r.alreadyHad.length} already had it.`]
        : [],
  };
}

function rewardLines(rewards: (Rewards | null | undefined)[]): string[] {
  const xp = rewards.reduce((sum, r) => sum + (r?.xp ?? 0), 0);
  const badges = rewards.filter((r) => r?.badge).length;
  return [
    ...(xp > 0 ? [`${xp} XP awarded.`] : []),
    ...(badges > 0 ? [`${plural(badges, "badge")} earned.`] : []),
  ];
}

export function gradeMessage(r: {
  results: {
    ok: boolean;
    status?: string;
    rewards?: Rewards | null;
    error?: string;
  }[];
}): ToastMessage {
  const ok = r.results.filter((x) => x.ok);
  const failed = r.results.filter((x) => !x.ok);
  const passed = ok.filter((x) => x.status === "PASSED").length;
  const notYet = ok.filter((x) => x.status === "NOT_YET").length;
  return {
    tone: failed.length > 0 ? "warning" : "success",
    title: `Saved ${plural(ok.length, "grade")}`,
    detail: [
      `${passed} passed, ${notYet} not yet.`,
      ...rewardLines(ok.map((x) => x.rewards)),
      ...(failed.length > 0
        ? [`${failed.length} not saved: ${failed[0].error}`]
        : []),
    ],
  };
}

export function challengeLogMessage(r: {
  status: string;
  progressCount: number;
  targetCount: number;
  attemptsLeft: number;
  rewards: Rewards | null;
}): ToastMessage {
  if (r.status === "PASSED") {
    return {
      tone: "success",
      title: "Challenge passed",
      detail: rewardLines([r.rewards]),
    };
  }
  if (r.status === "NOT_YET") {
    return {
      tone: "info",
      title: "Not yet",
      detail: [
        `Finished on ${r.progressCount} of ${r.targetCount}. The target is out of reach this time.`,
      ],
    };
  }
  return {
    tone: "info",
    title: `${r.progressCount} of ${r.targetCount}`,
    detail: [`${plural(r.attemptsLeft, "attempt")} left.`],
  };
}

export function masteryMessage(r: {
  results: ({ awardedBadges: { title: string }[] } | { error: string })[];
}): ToastMessage {
  const ok = r.results.filter(
    (x): x is { awardedBadges: { title: string }[] } => "awardedBadges" in x,
  );
  const failed = r.results.length - ok.length;
  const badges = ok.flatMap((x) => x.awardedBadges.map((b) => b.title));
  return {
    tone: failed > 0 ? "warning" : "success",
    title: `${plural(ok.length, "topic")} marked Mastered`,
    detail: [
      ...(badges.length > 0
        ? [`Branch badges: ${[...new Set(badges)].join(", ")}.`]
        : []),
      ...(failed > 0 ? [`${failed} couldn't be saved.`] : []),
    ],
  };
}

export function errorMessage(
  err: unknown,
  title = "Something went wrong",
): ToastMessage {
  return {
    tone: "error",
    title,
    detail: [err instanceof Error ? err.message : String(err)],
  };
}
