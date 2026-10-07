// Path: app/admin/tasks/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import TopicPicker, { flattenTopics } from "@/components/admin/TopicPicker";
import {
  ASSIGNMENT_STATUS,
  TASK_TYPE_LABEL,
  button,
  card,
  cx,
  formatDate,
  ui,
} from "@/components/admin/ui";
import { useCached, useModuleTrees } from "@/components/admin/useAdminData";
import type { TaskRecord } from "@/components/admin/TaskForm";

type Stats = Record<
  "total" | "ASSIGNED" | "IN_PROGRESS" | "PASSED" | "NOT_YET" | "EXPIRED",
  number
>;
type TaskRow = TaskRecord & { stats: Stats };

const TYPES = [
  { key: "", label: "All types" },
  { key: "PUZZLE", label: "Puzzles" },
  { key: "FIELD_CHECK", label: "Field checks" },
  { key: "CHALLENGE", label: "Challenges" },
];

function StatsBar({ stats }: { stats: Stats }) {
  if (stats.total === 0)
    return <span className={ui.hint}>Not assigned yet</span>;
  const active = stats.ASSIGNED + stats.IN_PROGRESS;
  const parts = [
    { n: stats.PASSED, color: ASSIGNMENT_STATUS.PASSED.color, label: "passed" },
    {
      n: stats.NOT_YET,
      color: ASSIGNMENT_STATUS.NOT_YET.color,
      label: "not yet",
    },
    { n: active, color: ASSIGNMENT_STATUS.IN_PROGRESS.color, label: "active" },
    {
      n: stats.EXPIRED,
      color: ASSIGNMENT_STATUS.EXPIRED.color,
      label: "expired",
    },
  ].filter((p) => p.n > 0);
  return (
    <div className="w-48">
      <div
        className="flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
        aria-hidden
      >
        {parts.map((p) => (
          <div
            key={p.label}
            style={{
              width: `${(p.n / stats.total) * 100}%`,
              backgroundColor: p.color,
            }}
          />
        ))}
      </div>
      <p className={cx(ui.hint, "mt-1")}>
        {parts.map((p) => `${p.n} ${p.label}`).join(", ")}
      </p>
    </div>
  );
}

export default function TasksPage() {
  const [type, setType] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const q = new URLSearchParams();
  if (type) q.set("type", type);
  if (topicId) q.set("skillNodeId", topicId);
  if (showArchived) q.set("includeArchived", "true");
  const tasks = useCached<TaskRow[]>(`/api/tasks?${q}`);
  const trees = useModuleTrees();
  const topicTitle = useMemo(
    () =>
      new Map(
        flattenTopics(trees.data?.trees ?? []).map((t) => [t.id, t.title]),
      ),
    [trees.data],
  );

  const rows = tasks.data ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <AdminHeader
        title="Tasks"
        description="Puzzles, field checks and challenges. Each one tests a topic."
        actions={
          <Link href="/admin/tasks/new" className={button.primary}>
            New task
          </Link>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[auto_18rem_auto] md:items-end">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter by type"
        >
          {TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={type === t.key}
              onClick={() => setType(t.key)}
              className={cx(ui.chip(type === t.key), ui.focus)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <TopicPicker
          label="Topic"
          value={topicId}
          onChange={(id) => setTopicId(id)}
          placeholder="All topics"
        />
        <label className="flex items-center gap-2 font-body text-sm text-sky/80 md:justify-end">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 accent-[#018ABE]"
          />
          Show archived
        </label>
      </div>

      <div className={cx(card, "overflow-x-auto")}>
        {tasks.loading && <p className={cx(ui.hint, "p-5")}>Loading tasks…</p>}
        {tasks.error && (
          <p className={cx(ui.error, "p-5")}>
            Couldn&apos;t load tasks: {tasks.error}
          </p>
        )}
        {!tasks.loading && !tasks.error && rows.length === 0 && (
          <div className="p-10 text-center">
            <p className="font-body text-sm text-sky/70">
              No tasks match these filters.
            </p>
            <Link
              href="/admin/tasks/new"
              className={cx(button.secondary, "mt-4")}
            >
              Create a task
            </Link>
          </div>
        )}
        {rows.length > 0 && (
          <table className="w-full min-w-[44rem] text-left">
            <thead>
              <tr className="border-b border-sky/10 font-body text-xs text-sky/70">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Players</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky/10">
              {rows.map((t) => (
                <tr
                  key={t._id}
                  className={cx(
                    "hover:bg-white/[0.02]",
                    t.isArchived && "opacity-50",
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tasks/${t._id}`}
                      className="font-body text-sm font-semibold text-mist hover:underline"
                    >
                      {t.title}
                    </Link>
                    <p className={ui.hint}>
                      {topicTitle.get(String(t.skillNodeId)) ?? "Unknown topic"}
                      {t.isArchived && ", archived"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-sky">
                    {TASK_TYPE_LABEL[t.type]}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-sky">
                    {formatDate(t.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <StatsBar stats={t.stats} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
