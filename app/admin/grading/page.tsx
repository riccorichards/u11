// Path: app/admin/grading/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import ChallengeLogDialog, {
  ChallengeAssignment,
} from "@/components/admin/ChallengeLogDialog";
import { useToast } from "@/components/admin/ResultToast";
import {
  challengeLogMessage,
  errorMessage,
  gradeMessage,
} from "@/components/admin/resultMessages";
import StatusPill from "@/components/admin/StatusPill";
import type { TaskRecord } from "@/components/admin/TaskForm";
import {
  ASSIGNMENT_STATUS,
  POSITION_COLOR,
  button,
  card,
  cx,
  formatDate,
  playerName,
  ui,
} from "@/components/admin/ui";
import {
  PlayerOption,
  invalidateAdminData,
  sendJson,
  useCached,
} from "@/components/admin/useAdminData";

interface Assignment extends ChallengeAssignment {
  playerId: PlayerOption | null;
  grade: { note: string; gradedAt: string | null } | null;
}

type Tab = "field" | "challenge";

function Grading() {
  const router = useRouter();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "challenge" ? "challenge" : "field";
  const taskId = params.get("task");

  function navigate(next: { tab?: Tab; task?: string | null }) {
    const q = new URLSearchParams();
    q.set("tab", next.tab ?? tab);
    const t = next.task === undefined ? taskId : next.task;
    if (t) q.set("task", t);
    router.replace(`/admin/grading?${q}`);
  }

  const tasks = useCached<TaskRecord[]>(
    `/api/tasks?type=${tab === "field" ? "FIELD_CHECK" : "CHALLENGE"}`,
  );
  const taskList = tasks.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <AdminHeader
        title="Grading"
        description="Grade field checks after training and log challenge attempts."
      />

      <div
        className="mb-6 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Grading type"
      >
        {(
          [
            ["field", "Field checks"],
            ["challenge", "Challenges"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => navigate({ tab: key, task: null })}
            className={cx(ui.chip(tab === key), ui.focus)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="grading-task" className={ui.label}>
          {tab === "field" ? "Field check" : "Challenge"}
        </label>
        <select
          id="grading-task"
          value={taskId ?? ""}
          onChange={(e) => navigate({ task: e.target.value || null })}
          className={ui.input}
        >
          <option value="">{tasks.loading ? "Loading…" : "Choose one"}</option>
          {taskList.map((t) => (
            <option key={t._id} value={t._id}>
              {t.title}
              {t.dueDate ? `, due ${formatDate(t.dueDate)}` : ""}
            </option>
          ))}
        </select>
        {!tasks.loading && taskList.length === 0 && (
          <p className={cx(ui.hint, "mt-2")}>
            No {tab === "field" ? "field checks" : "challenges"} yet. Create one
            on the Tasks page.
          </p>
        )}
      </div>

      {taskId && tab === "field" && (
        <FieldCheckGrading key={taskId} taskId={taskId} />
      )}
      {taskId && tab === "challenge" && (
        <ChallengeGrading key={taskId} taskId={taskId} />
      )}
    </div>
  );
}

type Draft = { result: "PASSED" | "NOT_YET" | null; note: string };

function FieldCheckGrading({ taskId }: { taskId: string }) {
  const { show } = useToast();
  const data = useCached<{ task: TaskRecord; assignments: Assignment[] }>(
    `/api/tasks/${taskId}/assignments`,
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState(false);

  const assignments = useMemo(
    () =>
      [...(data.data?.assignments ?? [])].sort(
        (a, b) => (a.playerId?.number ?? 0) - (b.playerId?.number ?? 0),
      ),
    [data.data],
  );

  function savedDraft(a: Assignment): Draft {
    const graded = a.status === "PASSED" || a.status === "NOT_YET";
    return {
      result: graded ? (a.status as Draft["result"]) : null,
      note: a.grade?.note ?? "",
    };
  }

  useEffect(() => {
    setDrafts(
      Object.fromEntries(assignments.map((a) => [a._id, savedDraft(a)])),
    );
  }, [assignments]);

  const changed = assignments.filter((a) => {
    const d = drafts[a._id];
    const s = savedDraft(a);
    return (
      d &&
      d.result !== null &&
      (d.result !== s.result || d.note.trim() !== s.note)
    );
  });

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((ds) => ({ ...ds, [id]: { ...ds[id], ...patch } }));
  }

  async function save() {
    if (changed.length === 0) return;
    setSaving(true);
    try {
      const res = await sendJson<Parameters<typeof gradeMessage>[0]>(
        `/api/tasks/${taskId}/field-check`,
        "POST",
        {
          grades: changed.map((a) => ({
            playerId: a.playerId?._id,
            result: drafts[a._id].result,
            note: drafts[a._id].note.trim(),
          })),
        },
      );
      show(gradeMessage(res));
      invalidateAdminData();
      data.reload();
    } catch (err) {
      show(errorMessage(err, "Couldn't save grades"));
    } finally {
      setSaving(false);
    }
  }

  if (data.loading && !data.data)
    return <p className={ui.hint}>Loading players…</p>;
  if (data.error)
    return (
      <p className={ui.error}>
        Couldn&apos;t load this field check: {data.error}
      </p>
    );
  const task = data.data?.task;

  return (
    <section aria-label="Grade players" className={cx(card, "overflow-hidden")}>
      {task?.fieldCheck?.criteria && (
        <div className="border-b border-sky/10 px-5 py-4">
          <p className={ui.label}>A pass looks like</p>
          <p className="font-body text-sm text-mist">
            {task.fieldCheck.criteria}
          </p>
        </div>
      )}
      {assignments.length === 0 ? (
        <p className={cx(ui.hint, "p-6")}>
          Nobody has this field check yet. Assign it from the task page first.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky/10 px-5 py-3">
            <span className={ui.hint}>{assignments.length} players</span>
            <button
              type="button"
              className={cx(ui.textButton, ui.focus)}
              onClick={() =>
                setDrafts((ds) =>
                  Object.fromEntries(
                    Object.entries(ds).map(([id, d]) => [
                      id,
                      { ...d, result: d.result ?? "PASSED" },
                    ]),
                  ),
                )
              }
            >
              Mark everyone ungraded as passed
            </button>
          </div>
          <ul className="divide-y divide-sky/10">
            {assignments.map((a) => {
              const d = drafts[a._id] ?? { result: null, note: "" };
              const p = a.playerId;
              return (
                <li
                  key={a._id}
                  className="grid gap-3 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {p && (
                      <span
                        className="flex h-7 w-8 shrink-0 items-center justify-center rounded font-display text-xs font-bold text-white"
                        style={{ backgroundColor: POSITION_COLOR[p.position] }}
                        aria-hidden
                      >
                        {p.number}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm text-mist">
                        {playerName(p)}
                      </p>
                      <input
                        value={d.note}
                        onChange={(e) =>
                          setDraft(a._id, { note: e.target.value })
                        }
                        placeholder="Note (optional)"
                        aria-label={`Note for ${playerName(p)}`}
                        className={cx(ui.input, "mt-1 py-1 text-xs")}
                      />
                    </div>
                  </div>
                  <div
                    className="flex gap-2"
                    role="group"
                    aria-label={`Grade for ${playerName(p)}`}
                  >
                    <button
                      type="button"
                      aria-pressed={d.result === "PASSED"}
                      onClick={() => setDraft(a._id, { result: "PASSED" })}
                      className={cx(
                        button.small,
                        "rounded-md border px-4 font-body font-medium transition",
                        ui.focus,
                        d.result === "PASSED"
                          ? "border-[#1FA97A] bg-[#1FA97A] text-white"
                          : "border-sky/20 text-sky/80 hover:text-mist",
                      )}
                    >
                      Passed
                    </button>
                    <button
                      type="button"
                      aria-pressed={d.result === "NOT_YET"}
                      onClick={() => setDraft(a._id, { result: "NOT_YET" })}
                      className={cx(
                        button.small,
                        "rounded-md border px-4 font-body font-medium transition",
                        ui.focus,
                        d.result === "NOT_YET"
                          ? "border-[#E8735C] bg-[#E8735C] text-white"
                          : "border-sky/20 text-sky/80 hover:text-mist",
                      )}
                    >
                      Not yet
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-sky/10 bg-[#0B2133] px-5 py-3">
            <span className={ui.hint} aria-live="polite">
              {changed.length === 0
                ? "No unsaved changes."
                : `${changed.length} unsaved ${changed.length === 1 ? "grade" : "grades"}.`}
            </span>
            <button
              type="button"
              onClick={save}
              disabled={saving || changed.length === 0}
              className={button.primary}
            >
              {saving ? "Saving…" : "Save grades"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function ChallengeGrading({ taskId }: { taskId: string }) {
  const { show } = useToast();
  const data = useCached<{ task: TaskRecord; assignments: Assignment[] }>(
    `/api/tasks/${taskId}/assignments`,
  );
  const [logFor, setLogFor] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const task = data.data?.task;
  const assignments = useMemo(
    () =>
      [...(data.data?.assignments ?? [])].sort(
        (a, b) => (a.playerId?.number ?? 0) - (b.playerId?.number ?? 0),
      ),
    [data.data],
  );

  function refresh() {
    invalidateAdminData();
    data.reload();
  }

  async function quickLog(a: Assignment, success: boolean) {
    setBusyId(a._id);
    try {
      const res = await sendJson<Parameters<typeof challengeLogMessage>[0]>(
        `/api/assignments/${a._id}/challenge-log`,
        "POST",
        { success },
      );
      const msg = challengeLogMessage(res);
      show({ ...msg, title: `${playerName(a.playerId)}: ${msg.title}` });
      refresh();
    } catch (err) {
      show(errorMessage(err, "Couldn't log the attempt"));
    } finally {
      setBusyId(null);
    }
  }

  if (data.loading && !data.data)
    return <p className={ui.hint}>Loading players…</p>;
  if (data.error || !task?.challenge)
    return (
      <p className={ui.error}>
        Couldn&apos;t load this challenge: {data.error}
      </p>
    );
  const { targetCount, attemptCount } = task.challenge;

  return (
    <section aria-label="Log attempts" className={cx(card, "overflow-hidden")}>
      <div className="border-b border-sky/10 px-5 py-4">
        <p className="font-body text-sm text-mist">
          Target: {targetCount} successes in {attemptCount} attempts.
        </p>
      </div>
      {assignments.length === 0 ? (
        <p className={cx(ui.hint, "p-6")}>
          Nobody has this challenge yet. Assign it from the task page first.
        </p>
      ) : (
        <ul className="divide-y divide-sky/10">
          {assignments.map((a) => {
            const active =
              a.status === "ASSIGNED" || a.status === "IN_PROGRESS";
            const pct = Math.min(100, (a.progressCount / targetCount) * 100);
            return (
              <li
                key={a._id}
                className="grid gap-3 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="truncate font-body text-sm text-mist">
                      {playerName(a.playerId)}
                    </p>
                    <StatusPill {...ASSIGNMENT_STATUS[a.status]} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div
                      className="h-1.5 w-40 overflow-hidden rounded-full bg-white/[0.08]"
                      aria-hidden
                    >
                      <div
                        className="h-full bg-[#1FA97A]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={ui.hint}>
                      {a.progressCount} of {targetCount},{" "}
                      {a.challengeLog.length}/{attemptCount} attempts
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {active && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === a._id}
                        onClick={() => quickLog(a, true)}
                        className={cx(
                          button.small,
                          button.primary,
                          "bg-[#1FA97A] hover:bg-[#23bf8a]",
                        )}
                      >
                        Made it
                      </button>
                      <button
                        type="button"
                        disabled={busyId === a._id}
                        onClick={() => quickLog(a, false)}
                        className={cx(button.small, button.secondary)}
                      >
                        Missed
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setLogFor(a._id)}
                    className={cx(button.small, button.secondary)}
                  >
                    {active ? "With note" : "View log"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ChallengeLogDialog
        assignment={assignments.find((a) => a._id === logFor) ?? null}
        targetCount={targetCount}
        attemptCount={attemptCount}
        onClose={() => setLogFor(null)}
        onLogged={refresh}
      />
    </section>
  );
}

export default function GradingPage() {
  return (
    <Suspense>
      <Grading />
    </Suspense>
  );
}
