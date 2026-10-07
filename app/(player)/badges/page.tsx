// Path: app/(player)/badges/page.tsx
"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cx } from "@/components/admin/ui";
import BadgeTile from "@/components/player/BadgeTile";
import { copy } from "@/components/player/copy";
import { LoadError, Loading } from "@/components/player/LoadState";
import { useCached } from "@/components/player/api";
import { playerCard, playerFocus } from "@/components/player/theme";
import type { MyBadges } from "@/components/player/types";

export default function MyBadgesPage() {
  const data = useCached<MyBadges>("/api/badges/mine");
  const d = data.data;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <Link
        href="/skill-tree"
        className={cx(
          "mb-4 inline-flex min-h-11 items-center gap-1 font-body text-sm text-sky",
          playerFocus,
        )}
      >
        <ChevronLeft size={18} aria-hidden />
        {copy.brain.title}
      </Link>
      <h1 className="mb-6 font-display text-3xl font-extrabold text-mist">
        {copy.badges.title}
      </h1>

      {data.loading && !d && <Loading />}
      {data.error && <LoadError what="your badges" onRetry={data.reload} />}

      {d && (
        <div className="space-y-8">
          <section aria-labelledby="earned">
            <h2
              id="earned"
              className="mb-3 font-display text-xl font-bold text-mist"
            >
              {copy.badges.earned} ({d.earned.length})
            </h2>
            {d.earned.length === 0 ? (
              <p
                className={cx(
                  playerCard,
                  "px-5 py-8 text-center font-body text-sm text-sky",
                )}
              >
                {copy.badges.emptyEarned}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {d.earned.map((b) => (
                  <BadgeTile
                    key={b._id}
                    title={b.title}
                    iconUrl={b.iconUrl}
                    earned
                    subtitle={
                      b.awardSource === "COACH"
                        ? b.note || copy.badges.fromCoach
                        : new Date(b.earnedAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                          })
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="goals">
            <h2
              id="goals"
              className="mb-3 font-display text-xl font-bold text-mist"
            >
              {copy.badges.goals}
            </h2>
            {d.goals.length === 0 ? (
              <p
                className={cx(
                  playerCard,
                  "px-5 py-8 text-center font-body text-sm text-sky",
                )}
              >
                {copy.badges.emptyGoals}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {d.goals.map((g) => {
                  const how =
                    g.kind === "BRANCH"
                      ? copy.badges.branchHow(g.how.topicTitle ?? "")
                      : copy.badges.taskHow(g.how.taskTitle ?? "");
                  const href = g.how.topicId
                    ? `/skill-tree/${g.how.topicId}`
                    : null;
                  const tile = (
                    <BadgeTile
                      title={g.title}
                      iconUrl={g.iconUrl}
                      earned={false}
                      subtitle={
                        g.progress
                          ? `${how}. ${copy.badges.progress(g.progress.done, g.progress.total)}`
                          : how
                      }
                      progress={g.progress}
                    />
                  );
                  return href ? (
                    <Link
                      key={g._id}
                      href={href}
                      className={cx("block rounded-2xl", playerFocus)}
                    >
                      {tile}
                    </Link>
                  ) : (
                    <div key={g._id}>{tile}</div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
