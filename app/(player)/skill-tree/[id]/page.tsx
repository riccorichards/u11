// Path: app/(player)/skill-tree/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  Lock,
  PlayCircle,
} from "lucide-react";
import { cx } from "@/components/admin/ui";
import { copy } from "@/components/player/copy";
import { LoadError, Loading } from "@/components/player/LoadState";
import Pill from "@/components/player/Pill";
import TaskCard from "@/components/player/TaskCard";
import { invalidateCache, sendJson, useCached } from "@/components/player/api";
import {
  PROGRESS_COLOR,
  bigButton,
  playerCard,
  playerFocus,
} from "@/components/player/theme";
import type { TopicPageData, TopicRef } from "@/components/player/types";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const data = useCached<TopicPageData>(`/api/topics/${id}`);
  const started = useRef(false);

  // Opening an Open topic counts as starting to learn it.
  useEffect(() => {
    if (data.data?.status !== "OPEN" || started.current) return;
    started.current = true;
    sendJson(`/api/topics/${id}/start`, "POST")
      .then(() => {
        invalidateCache();
        data.reload();
      })
      .catch(() => undefined);
  }, [data, id]);

  function refresh() {
    invalidateCache();
    data.reload();
  }

  const d = data.data;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <Link
        href="/skill-tree"
        className={cx(
          "mb-4 inline-flex min-h-11 items-center gap-1 font-body text-sm text-sky",
          playerFocus,
        )}
      >
        <ChevronLeft size={18} aria-hidden />
        {copy.topic.back}
      </Link>

      {data.loading && !d && <Loading />}
      {data.error && <LoadError what="this topic" onRetry={data.reload} />}

      {d && (
        <div className="space-y-6">
          <header>
            <p className="font-body text-xs text-sky/70">
              {[d.module.title.ka, ...d.path.map((p) => p.title)].join(" › ")}
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-mist">
              {d.topic.title}
            </h1>
            {d.topic.titleEn && (
              <p className="font-body text-base text-sky">{d.topic.titleEn}</p>
            )}
            <div className="mt-3">
              <Pill
                label={copy.status[d.status]}
                color={PROGRESS_COLOR[d.status]}
              />
            </div>
            {!d.topic.forMyPosition && (
              <p className="mt-3 font-body text-sm text-sky/80">
                {copy.topic.otherPosition}
              </p>
            )}
          </header>

          {d.locked ? (
            <section className={cx(playerCard, "px-5 py-8 text-center")}>
              <Lock size={28} className="mx-auto text-sky/60" aria-hidden />
              <h2 className="mt-3 font-display text-lg font-bold text-mist">
                {copy.topic.lockedTitle}
              </h2>
              <p className="mt-1 font-body text-sm text-sky">
                {copy.topic.lockedBody}
              </p>
            </section>
          ) : (
            <>
              <section aria-labelledby="learn" className="space-y-3">
                <h2
                  id="learn"
                  className="font-display text-xl font-bold text-mist"
                >
                  {copy.topic.learn}
                </h2>
                {d.topic.description && (
                  <p className="font-body text-base leading-relaxed text-mist">
                    {d.topic.description}
                  </p>
                )}
                {d.lesson &&
                (d.lesson.videoUrl ||
                  d.lesson.diagramUrl ||
                  d.lesson.keyPoints.length > 0) ? (
                  <>
                    {d.lesson.videoUrl && (
                      <a
                        href={d.lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx(bigButton, "w-full bg-ocean text-white")}
                      >
                        <PlayCircle size={20} aria-hidden />
                        {copy.topic.watch}
                      </a>
                    )}
                    {d.lesson.diagramUrl && (
                      <figure>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={d.lesson.diagramUrl}
                          alt={`${copy.topic.diagram}: ${d.topic.title}`}
                          className="w-full rounded-2xl border border-white/10"
                        />
                      </figure>
                    )}
                    {d.lesson.keyPoints.length > 0 && (
                      <div className={cx(playerCard, "p-4")}>
                        <h3 className="font-body text-sm font-semibold text-sky">
                          {copy.topic.keyPoints}
                        </h3>
                        <ul className="mt-2 space-y-2">
                          {d.lesson.keyPoints.map((k, i) => (
                            <li
                              key={i}
                              className="flex gap-3 font-body text-base text-mist"
                            >
                              <span
                                className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#1FA97A]"
                                aria-hidden
                              />
                              {k}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="font-body text-sm text-sky/80">
                    {copy.topic.noLesson}
                  </p>
                )}
              </section>

              <section aria-labelledby="test" className="space-y-3">
                <h2
                  id="test"
                  className="font-display text-xl font-bold text-mist"
                >
                  {copy.topic.test}
                </h2>
                {d.tasks.length === 0 ? (
                  <p className="font-body text-sm text-sky/80">
                    {copy.topic.noTasks}
                  </p>
                ) : (
                  d.tasks.map((t) => (
                    <TaskCard
                      key={t.assignmentId}
                      item={t}
                      onChanged={refresh}
                      showTopic={false}
                    />
                  ))
                )}
              </section>
            </>
          )}

          {d.prerequisites.length > 0 && (
            <TopicLinks
              title={copy.topic.prerequisites}
              topics={d.prerequisites}
            />
          )}
          {!d.locked && d.subtopics.length > 0 && (
            <TopicLinks title={copy.topic.subtopics} topics={d.subtopics} />
          )}

          {d.badges.length > 0 && (
            <section aria-labelledby="topic-badges" className="space-y-2">
              <h2
                id="topic-badges"
                className="font-display text-lg font-bold text-mist"
              >
                {copy.topic.badges}
              </h2>
              <ul className="space-y-2">
                {d.badges.map((b) => (
                  <li
                    key={b._id}
                    className={cx(
                      playerCard,
                      "flex items-center gap-3 px-4 py-3",
                      !b.earned && "opacity-70",
                    )}
                  >
                    <Award
                      size={22}
                      className={b.earned ? "text-[#E0A72F]" : "text-sky/50"}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-sm font-semibold text-mist">
                        {b.title}
                      </span>
                      {b.description && (
                        <span className="block font-body text-xs text-sky/70">
                          {b.description}
                        </span>
                      )}
                    </span>
                    {b.earned && (
                      <span className="font-body text-xs font-semibold text-[#E0A72F]">
                        {copy.topic.earned}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function TopicLinks({ title, topics }: { title: string; topics: TopicRef[] }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-bold text-mist">{title}</h2>
      <ul className="space-y-2">
        {topics.map((t) => {
          const locked = t.status === "LOCKED";
          const body = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-sm font-semibold text-mist">
                  {t.title}
                </span>
                {t.titleEn && (
                  <span className="block truncate font-body text-xs text-sky/70">
                    {t.titleEn}
                  </span>
                )}
              </span>
              <Pill
                label={copy.status[t.status]}
                color={PROGRESS_COLOR[t.status]}
              />
              {!locked && (
                <ChevronRight size={18} className="text-sky/60" aria-hidden />
              )}
            </>
          );
          return (
            <li key={t.id}>
              {locked ? (
                <div
                  className={cx(
                    playerCard,
                    "flex min-h-14 items-center gap-3 px-4 py-3 opacity-60",
                  )}
                >
                  {body}
                </div>
              ) : (
                <Link
                  href={`/skill-tree/${t.id}`}
                  className={cx(
                    playerCard,
                    playerFocus,
                    "flex min-h-14 items-center gap-3 px-4 py-3",
                  )}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
