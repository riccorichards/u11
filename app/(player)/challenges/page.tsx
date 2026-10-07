// Path: app/(player)/challenges/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { cx } from "@/components/admin/ui";
import { copy } from "@/components/player/copy";
import { LoadError, Loading } from "@/components/player/LoadState";
import TaskCard from "@/components/player/TaskCard";
import { invalidateCache, useCached } from "@/components/player/api";
import { playerCard, playerFocus } from "@/components/player/theme";
import type { FeedItem } from "@/components/player/types";

/** "My tasks": every puzzle, field check and challenge assigned to this player. */
export default function MyTasksPage() {
  const [tab, setTab] = useState<"active" | "done">("active");
  const feed = useCached<FeedItem[]>(`/api/tasks/mine?filter=${tab}`);
  const items = feed.data ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <header className="mb-5 flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold text-mist">
          {copy.tasks.title}
        </h1>
        <Link
          href="/badges"
          className="font-body text-sm text-sky underline-offset-2 hover:underline"
        >
          {copy.brain.badgesLink}
        </Link>
      </header>

      <div
        className="mb-4 grid grid-cols-2 rounded-xl bg-white/[0.06] p-1"
        role="tablist"
        aria-label={copy.tasks.title}
      >
        {(["active", "done"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cx(
              "min-h-11 rounded-lg font-body text-sm font-semibold",
              playerFocus,
              tab === t ? "bg-white/15 text-mist" : "text-sky/70",
            )}
          >
            {t === "active" ? copy.tasks.active : copy.tasks.done}
          </button>
        ))}
      </div>

      {feed.loading && !feed.data && <Loading />}
      {feed.error && <LoadError what="your tasks" onRetry={feed.reload} />}
      {feed.data && items.length === 0 && (
        <p
          className={cx(
            playerCard,
            "px-5 py-10 text-center font-body text-sm text-sky",
          )}
        >
          {tab === "active" ? copy.tasks.emptyActive : copy.tasks.emptyDone}
        </p>
      )}
      <div className="space-y-3">
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
      </div>
    </div>
  );
}
