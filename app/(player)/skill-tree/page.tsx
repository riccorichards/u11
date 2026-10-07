// Path: app/(player)/skill-tree/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { cx } from "@/components/admin/ui";
import BrainTree from "@/components/player/BrainTree";
import { copy } from "@/components/player/copy";
import { LoadError, Loading } from "@/components/player/LoadState";
import Pill from "@/components/player/Pill";
import {
  ModuleTreeDTO,
  TreeDatumDTO,
  useCached,
} from "@/components/player/api";
import {
  PROGRESS_COLOR,
  playerCard,
  playerFocus,
} from "@/components/player/theme";
import type { MyBadges, ProgressStatus } from "@/components/player/types";

type BrainModule = ModuleTreeDTO & { masteredCount: number };

export default function BrainPage() {
  const router = useRouter();
  const brain = useCached<{ trees: BrainModule[] }>("/api/skill-tree/modules");
  const badges = useCached<MyBadges>("/api/badges/mine");
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [view, setView] = useState<"tree" | "list">("tree");
  const [hint, setHint] = useState<string | null>(null);

  const modules = brain.data?.trees ?? [];
  useEffect(() => {
    if (!moduleId && modules.length) setModuleId(modules[0].moduleId);
  }, [modules, moduleId]);
  const active = modules.find((m) => m.moduleId === moduleId) ?? null;

  const badgeNodeIds = useMemo(
    () =>
      new Set(
        (badges.data?.earned ?? [])
          .map((b) => b.skillNodeId)
          .filter((id): id is string => Boolean(id)),
      ),
    [badges.data],
  );

  function select(id: string, status: ProgressStatus, isContext: boolean) {
    if (status === "LOCKED") {
      setHint(isContext ? copy.brain.contextHint : copy.brain.lockedHint);
      return;
    }
    router.push(`/skill-tree/${id}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl font-extrabold text-mist">
          {copy.brain.title}
        </h1>
        <p className="mt-1 font-body text-sm text-sky">{copy.brain.subtitle}</p>
        <div className="mt-3 flex gap-4 font-body text-sm">
          <Link
            href="/challenges"
            className="text-sky underline-offset-2 hover:underline"
          >
            {copy.brain.tasksLink}
          </Link>
          <Link
            href="/badges"
            className="text-sky underline-offset-2 hover:underline"
          >
            {copy.brain.badgesLink}
          </Link>
        </div>
      </header>

      {brain.loading && !brain.data && <Loading />}
      {brain.error && <LoadError what="your Brain" onRetry={brain.reload} />}
      {brain.data && modules.length === 0 && (
        <p
          className={cx(
            playerCard,
            "px-5 py-10 text-center font-body text-sm text-sky",
          )}
        >
          {copy.brain.noModules}
        </p>
      )}

      {modules.length > 0 && (
        <>
          <nav
            aria-label="Modules"
            className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1"
          >
            {modules.map((m) => (
              <button
                key={m.moduleId ?? m.slug}
                type="button"
                onClick={() => {
                  setModuleId(m.moduleId);
                  setHint(null);
                }}
                aria-current={m.moduleId === moduleId ? "page" : undefined}
                className={cx(
                  "min-h-11 shrink-0 rounded-xl px-4 font-body text-sm font-semibold transition",
                  playerFocus,
                  m.moduleId === moduleId
                    ? "bg-ocean text-white"
                    : "bg-white/[0.06] text-sky",
                )}
              >
                {m.title.ka}
              </button>
            ))}
          </nav>

          {active && (
            <>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold text-mist">
                    {active.title.ka}
                  </h2>
                  {active.title.en && (
                    <p className="font-body text-xs text-sky/70">
                      {active.title.en}
                    </p>
                  )}
                </div>
                <div
                  className="flex shrink-0 rounded-xl bg-white/[0.06] p-1"
                  role="group"
                  aria-label="View"
                >
                  {(["tree", "list"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={cx(
                        "min-h-9 rounded-lg px-3 font-body text-xs font-semibold",
                        playerFocus,
                        view === v ? "bg-white/15 text-mist" : "text-sky/70",
                      )}
                    >
                      {v === "tree" ? copy.brain.treeView : copy.brain.listView}
                    </button>
                  ))}
                </div>
              </div>

              {active.topicCount > 0 && (
                <div className="mb-4">
                  <div className="mb-1 font-body text-xs font-semibold text-sky">
                    {copy.brain.mastered(
                      active.masteredCount,
                      active.topicCount,
                    )}
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-white/[0.08]"
                    aria-hidden
                  >
                    <div
                      className="h-full rounded-full bg-[#1FA97A]"
                      style={{
                        width: `${(active.masteredCount / active.topicCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {hint && (
                <p
                  role="status"
                  className="mb-3 flex items-center gap-2 rounded-xl bg-white/[0.06] px-4 py-3 font-body text-sm text-sky"
                >
                  <Lock size={16} aria-hidden />
                  {hint}
                </p>
              )}

              {active.tree.children.length === 0 ? (
                <p
                  className={cx(
                    playerCard,
                    "px-5 py-10 text-center font-body text-sm text-sky",
                  )}
                >
                  {copy.brain.emptyModule}
                </p>
              ) : view === "tree" ? (
                <BrainTree
                  data={active.tree}
                  badgeNodeIds={badgeNodeIds}
                  onSelect={select}
                />
              ) : (
                <TopicList
                  nodes={active.tree.children}
                  depth={0}
                  onSelect={select}
                  badgeNodeIds={badgeNodeIds}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TopicList({
  nodes,
  depth,
  onSelect,
  badgeNodeIds,
}: {
  nodes: TreeDatumDTO[];
  depth: number;
  onSelect: (id: string, status: ProgressStatus, isContext: boolean) => void;
  badgeNodeIds: Set<string>;
}) {
  return (
    <ul
      className={cx(
        "space-y-2",
        depth > 0 && "ml-4 mt-2 border-l border-white/10 pl-3",
      )}
    >
      {nodes.map((n) => {
        const id = String(n.attributes.id);
        const status = String(
          n.attributes.status ?? "LOCKED",
        ) as ProgressStatus;
        const isContext = n.attributes.isContext === true;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id, status, isContext)}
              className={cx(
                playerCard,
                playerFocus,
                "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left",
                (status === "LOCKED" || isContext) && "opacity-60",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-body text-sm font-semibold text-mist">
                  {n.name}
                  {badgeNodeIds.has(id) && (
                    <span
                      className="ml-1 text-[#E0A72F]"
                      aria-label="badge earned"
                    >
                      ★
                    </span>
                  )}
                </span>
                {n.attributes.titleEn && (
                  <span className="block truncate font-body text-xs text-sky/70">
                    {String(n.attributes.titleEn)}
                  </span>
                )}
              </span>
              <Pill
                label={copy.status[status]}
                color={PROGRESS_COLOR[status]}
              />
              {status !== "LOCKED" && (
                <ChevronRight size={18} className="text-sky/60" aria-hidden />
              )}
            </button>
            {n.children.length > 0 && (
              <TopicList
                nodes={n.children}
                depth={depth + 1}
                onSelect={onSelect}
                badgeNodeIds={badgeNodeIds}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
