// Path: app/admin/tasks/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AudiencePicker, {
  AudienceValue,
  DEFAULT_AUDIENCE,
  toApiAudience,
} from "@/components/admin/AudiencePicker";
import ChallengeLogDialog, {
  ChallengeAssignment,
} from "@/components/admin/ChallengeLogDialog";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import DueDatePicker from "@/components/admin/DueDatePicker";
import { useToast } from "@/components/admin/ResultToast";
import { assignMessage, errorMessage } from "@/components/admin/resultMessages";
import StatusPill from "@/components/admin/StatusPill";
import TaskForm, { TaskRecord } from "@/components/admin/TaskForm";
import { flattenTopics } from "@/components/admin/TopicPicker";
import {
  ASSIGNMENT_STATUS,
  TASK_TYPE_LABEL,
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
  useModuleTrees,
} from "@/components/admin/useAdminData";

interface Assignment extends ChallengeAssignment {
  source: {
    audienceType: "TEAM" | "POSITION" | "GROUP" | "PLAYER";
    position: string | null;
  };
  dueDate: string | null;
  puzzleAnswers: { optionId: string; isCorrect: boolean }[];
  grade: { note: string; gradedAt: string | null } | null;
  completedAt: string | null;
  playerId: PlayerOption | null;
}

const SOURCE_LABEL: Record<Assignment["source"]["audienceType"], string> = {
  TEAM: "Team",
  POSITION: "Position",
  GROUP: "Group",
  PLAYER: "Personal",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const data = useCached<{ task: TaskRecord; assignments: Assignment[] }>(
    `/api/tasks/${id}/assignments`,
  );
  const trees = useModuleTrees();

  const [editing, setEditing] = useState(false);
  const [audience, setAudience] = useState<AudienceValue>(DEFAULT_AUDIENCE);
  const [dueOverride, setDueOverride] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [logFor, setLogFor] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  const task = data.data?.task;
  const assignments = useMemo(
    () =>
      [...(data.data?.assignments ?? [])].sort(
        (a, b) => (a.playerId?.number ?? 0) - (b.playerId?.number ?? 0),
      ),
    [data.data],
  );
  const topic = flattenTopics(trees.data?.trees ?? []).find(
    (t) => t.id === String(task?.skillNodeId),
  );
  const contentLocked = assignments.some(
    (a) =>
      a.puzzleAnswers?.length > 0 ||
      a.challengeLog?.length > 0 ||
      Boolean(a.grade?.gradedAt),
  );

  function refresh() {
    invalidateAdminData();
    data.reload();
  }

  async function assign() {
    const api = toApiAudience(audience);
    if (!api) return;
    setAssigning(true);
    try {
      const res = await sendJson<Parameters<typeof assignMessage>[0]>(
        `/api/tasks/${id}/assign`,
        "POST",
        {
          audience: api,
          dueDate: dueOverride,
        },
      );
      show(assignMessage(res));
      setAudience(DEFAULT_AUDIENCE);
      setDueOverride(null);
      refresh();
    } catch (err) {
      show(errorMessage(err, "Couldn't assign the task"));
    } finally {
      setAssigning(false);
    }
  }

  async function archive() {
    setBusy(true);
    try {
      await sendJson(`/api/tasks/${id}`, "DELETE");
      show({
        tone: "success",
        title: "Task archived",
        detail: ["Players no longer see it. Their results are kept."],
      });
      invalidateAdminData();
      router.push("/admin/tasks");
    } catch (err) {
      show(errorMessage(err, "Couldn't archive the task"));
      setBusy(false);
    }
  }

  if (data.loading && !data.data) {
    return (
      <p className={cx(ui.hint, "mx-auto max-w-5xl px-6 py-12")}>
        Loading task…
      </p>
    );
  }
  if (data.error || !task) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <AdminHeader
          title="Task not found"
          backHref="/admin/tasks"
          backLabel="Tasks"
        />
        <p className={ui.error}>{data.error ?? "This task doesn't exist."}</p>
      </div>
    );
  }

  const counts = assignments.reduce<Record<string, number>>(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }),
    {},
  );
  const logAssignment = assignments.find((a) => a._id === logFor) ?? null;

  function progressText(a: Assignment): string {
    if (!task) return "";
    if (task.type === "PUZZLE")
      return `${a.puzzleAnswers?.length ?? 0} of 2 tries`;
    if (task.type === "CHALLENGE")
      return `${a.progressCount} of ${task.challenge?.targetCount}, ${a.challengeLog.length} attempts`;
    return a.grade?.note || (a.grade?.gradedAt ? "Graded" : "Not graded yet");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <AdminHeader
        title={task.title}
        description={`${TASK_TYPE_LABEL[task.type]} for ${topic?.title ?? "an unknown topic"}${task.dueDate ? `, due ${formatDate(task.dueDate)}` : ""}${task.isArchived ? ". Archived." : "."}`}
        backHref="/admin/tasks"
        backLabel="Tasks"
        actions={
          !task.isArchived && (
            <>
              {task.type === "FIELD_CHECK" && (
                <Link
                  href={`/admin/grading?tab=field&task=${task._id}`}
                  className={button.primary}
                >
                  Grade
                </Link>
              )}
              <button
                type="button"
                onClick={() => setEditing((e) => !e)}
                className={button.secondary}
              >
                {editing ? "Close editor" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmArchive(true)}
                className={button.danger}
              >
                Archive
              </button>
            </>
          )
        }
      />

      {editing && (
        <section className={cx(card, "mb-6 p-6")} aria-label="Edit task">
          <TaskForm
            task={task}
            contentLocked={contentLocked}
            onSaved={() => {
              setEditing(false);
              refresh();
            }}
            onCancel={() => setEditing(false)}
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section
          aria-label="Players"
          className={cx(card, "self-start overflow-x-auto")}
        >
          <div className="flex flex-wrap gap-3 border-b border-sky/10 px-4 py-3">
            {Object.entries(ASSIGNMENT_STATUS).map(([key, s]) =>
              counts[key] ? (
                <StatusPill
                  key={key}
                  label={`${counts[key]} ${s.label.toLowerCase()}`}
                  color={s.color}
                />
              ) : null,
            )}
            {assignments.length === 0 && (
              <span className={ui.hint}>
                Nobody has this task yet. Assign it on the right.
              </span>
            )}
          </div>
          {assignments.length > 0 && (
            <table className="w-full min-w-[36rem] text-left">
              <thead>
                <tr className="border-b border-sky/10 font-body text-xs text-sky/70">
                  <th className="px-4 py-2.5 font-medium">Player</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Progress</th>
                  <th className="px-4 py-2.5 font-medium">Due</th>
                  <th className="px-4 py-2.5 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky/10">
                {assignments.map((a) => {
                  const active =
                    a.status === "ASSIGNED" || a.status === "IN_PROGRESS";
                  return (
                    <tr key={a._id}>
                      <td className="px-4 py-2.5">
                        <p className="font-body text-sm text-mist">
                          {playerName(a.playerId)}
                        </p>
                        <p className={ui.hint}>
                          {SOURCE_LABEL[a.source.audienceType]}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusPill {...ASSIGNMENT_STATUS[a.status]} />
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-2.5 font-body text-sm text-sky">
                        {progressText(a)}
                      </td>
                      <td className="px-4 py-2.5 font-body text-sm text-sky">
                        {formatDate(a.dueDate ?? task.dueDate)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {task.type === "CHALLENGE" && (
                          <button
                            type="button"
                            onClick={() => setLogFor(a._id)}
                            className={cx(button.secondary, button.small)}
                          >
                            {active ? "Log attempt" : "View log"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {!task.isArchived && (
          <section
            aria-label="Assign"
            className={cx(card, "self-start space-y-4 p-5")}
          >
            <h2 className="font-display text-lg font-bold text-mist">
              Assign to more players
            </h2>
            <AudiencePicker value={audience} onChange={setAudience} />
            <DueDatePicker
              label="Due date for these players (optional)"
              value={dueOverride}
              onChange={setDueOverride}
            />
            <p className={ui.hint}>
              Players who already have this task are skipped.
            </p>
            <button
              type="button"
              onClick={assign}
              disabled={assigning || !toApiAudience(audience)}
              className={cx(button.primary, "w-full")}
            >
              {assigning ? "Assigning…" : "Assign"}
            </button>
          </section>
        )}
      </div>

      {task.type === "CHALLENGE" && task.challenge && (
        <ChallengeLogDialog
          assignment={logAssignment}
          targetCount={task.challenge.targetCount}
          attemptCount={task.challenge.attemptCount}
          onClose={() => setLogFor(null)}
          onLogged={refresh}
        />
      )}

      <ConfirmDialog
        open={confirmArchive}
        title="Archive this task?"
        message="Players stop seeing it. Results, XP and badges they've earned are kept."
        confirmLabel="Archive task"
        danger
        busy={busy}
        onConfirm={archive}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}
