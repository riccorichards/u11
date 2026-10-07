// Path: components/player/TaskCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Award, ClipboardCheck, Puzzle, Target } from "lucide-react";
import { cx } from "@/components/admin/ui";
import { copy } from "./copy";
import Pill from "./Pill";
import PuzzlePlayer from "./PuzzlePlayer";
import { ASSIGNMENT_COLOR, bigButton, playerCard } from "./theme";
import type { FeedItem } from "./types";

const ICON = { PUZZLE: Puzzle, FIELD_CHECK: ClipboardCheck, CHALLENGE: Target };

interface Props {
  item: FeedItem;
  /** Called after the player finishes a puzzle, so lists can refresh. */
  onChanged: () => void;
  /** Hide the topic link when already on that topic's page. */
  showTopic?: boolean;
}

export default function TaskCard({ item, onChanged, showTopic = true }: Props) {
  const [open, setOpen] = useState(false);
  const { task, progress } = item;
  const Icon = ICON[task.type];
  const due = item.isActive ? copy.due(item.dueDate) : null;

  return (
    <article className={cx(playerCard, "p-4")}>
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sky"
          aria-hidden
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-body text-base font-semibold text-mist">
              {task.title}
            </h3>
            {task.isDailyQuest && (
              <span className="rounded-md bg-[#E0A72F]/20 px-1.5 font-body text-[11px] font-semibold text-[#E0A72F]">
                {copy.home.dailyQuest}
              </span>
            )}
          </div>
          <p className="mt-0.5 font-body text-xs text-sky/70">
            {copy.type[task.type]}
            {showTopic && item.topic && (
              <>
                {" in "}
                <Link
                  href={`/skill-tree/${item.topic.id}`}
                  className="underline-offset-2 hover:underline"
                >
                  {item.topic.title}
                </Link>
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill
              label={copy.assignment[item.status]}
              color={ASSIGNMENT_COLOR[item.status]}
            />
            {due && (
              <span className="font-body text-xs text-sky/80">{due}</span>
            )}
            <span className="font-body text-xs font-semibold text-[#1FA97A]">
              {copy.tasks.xp(task.xpReward)}
            </span>
            {task.hasBadge && (
              <span className="inline-flex items-center gap-1 font-body text-xs text-[#E0A72F]">
                <Award size={14} aria-hidden />
                {copy.tasks.hasBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      {task.description && (
        <p className="mt-3 font-body text-sm text-sky">{task.description}</p>
      )}

      {task.type === "CHALLENGE" && progress.targetCount !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between font-body text-xs text-sky/80">
            <span>
              {copy.tasks.target(
                progress.progressCount ?? 0,
                progress.targetCount,
              )}
            </span>
            {item.isActive && (
              <span>{copy.tasks.attemptsLeft(progress.attemptsLeft ?? 0)}</span>
            )}
          </div>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-white/[0.08]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.targetCount}
            aria-valuenow={progress.progressCount ?? 0}
            aria-label={task.title}
          >
            <div
              className="h-full rounded-full bg-[#1FA97A]"
              style={{
                width: `${Math.min(100, ((progress.progressCount ?? 0) / progress.targetCount) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {task.type === "FIELD_CHECK" && (
        <div className="mt-3 space-y-2">
          {task.fieldCheck?.criteria && (
            <p className="font-body text-sm text-sky">
              {task.fieldCheck.criteria}
            </p>
          )}
          {item.isActive && (
            <p className="font-body text-xs text-sky/70">
              {copy.tasks.fieldCheck}
            </p>
          )}
          {progress.gradeNote && (
            <p className="rounded-xl bg-white/[0.04] px-3 py-2 font-body text-sm text-mist">
              <span className="block text-xs font-semibold text-sky/70">
                {copy.tasks.coachNote}
              </span>
              {progress.gradeNote}
            </p>
          )}
        </div>
      )}

      {task.type === "PUZZLE" && (
        <div className="mt-4">
          {open ? (
            <PuzzlePlayer
              item={item}
              onFinished={() => {
                setOpen(false);
                onChanged();
              }}
            />
          ) : item.isActive ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cx(bigButton, "w-full bg-ocean text-white")}
            >
              {copy.tasks.solve}
            </button>
          ) : item.status !== "EXPIRED" ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cx(
                bigButton,
                "w-full border border-white/15 text-mist",
              )}
            >
              {copy.tasks.review}
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}
