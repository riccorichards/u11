// Path: components/player/TodayTasksCard.tsx
"use client";

import Link from "next/link";
import { cx } from "@/components/admin/ui";
import { copy } from "./copy";
import TaskCard from "./TaskCard";
import { invalidateCache, useCached } from "./api";
import { playerCard } from "./theme";
import type { FeedItem } from "./types";

/**
 * For /home: replaces the old "today's puzzle" card. Shows the daily quest first,
 * then the most urgent tasks, up to three.
 */
export default function TodayTasksCard() {
  const feed = useCached<FeedItem[]>("/api/tasks/mine?filter=active");
  const items = [...(feed.data ?? [])]
    .sort((a, b) => Number(b.task.isDailyQuest) - Number(a.task.isDailyQuest))
    .slice(0, 3);

  return (
    <section aria-labelledby="today-tasks" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2
          id="today-tasks"
          className="font-display text-lg font-bold text-mist"
        >
          {copy.home.title}
        </h2>
        <Link
          href="/challenges"
          className="font-body text-sm text-sky underline-offset-2 hover:underline"
        >
          {copy.home.seeAll}
        </Link>
      </div>
      {feed.loading && !feed.data && (
        <p className="font-body text-sm text-sky/70">{copy.loading}</p>
      )}
      {feed.error && (
        <p className="font-body text-sm text-sky/70">
          {copy.loadError("your tasks")}
        </p>
      )}
      {feed.data && items.length === 0 && (
        <p
          className={cx(
            playerCard,
            "px-4 py-6 text-center font-body text-sm text-sky",
          )}
        >
          {copy.home.none}
        </p>
      )}
      {items.map((item) => (
        <TaskCard
          key={item.assignmentId}
          item={item}
          onChanged={() => {
            invalidateCache();
            feed.reload();
          }}
        />
      ))}
    </section>
  );
}
