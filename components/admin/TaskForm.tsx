// Path: components/admin/TaskForm.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import AudiencePicker, {
  AudienceValue,
  DEFAULT_AUDIENCE,
  toApiAudience,
} from "./AudiencePicker";
import DueDatePicker, { isoToDateInput } from "./DueDatePicker";
import TopicPicker from "./TopicPicker";
import { useToast } from "./ResultToast";
import { assignMessage, errorMessage } from "./resultMessages";
import { TASK_TYPE_LABEL, button, cx, ui } from "./ui";
import { invalidateAdminData, sendJson, useCached } from "./useAdminData";

export type TaskType = "PUZZLE" | "FIELD_CHECK" | "CHALLENGE";

export interface TaskRecord {
  _id: string;
  type: TaskType;
  skillNodeId: string;
  title: string;
  description: string;
  xpReward: number;
  badgeId: string | null;
  availableFrom: string | null;
  dueDate: string | null;
  isDailyQuest: boolean;
  isArchived: boolean;
  puzzle?: {
    question: string;
    diagramUrl: string;
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation: string;
  };
  challenge?: { targetCount: number; attemptCount: number };
  fieldCheck?: { criteria: string };
}

const LETTERS = "abcdefgh";

function startOfLocalDayISO(dateInput: string): string {
  const [y, m, d] = dateInput.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

interface Props {
  task?: TaskRecord | null;
  /** Content can't change once players have worked on the task. */
  contentLocked?: boolean;
  defaultTopicId?: string | null;
  onSaved: (task: TaskRecord) => void;
  onCancel?: () => void;
}

type BadgeMode = "none" | "existing" | "new";

export default function TaskForm({
  task,
  contentLocked = false,
  defaultTopicId = null,
  onSaved,
  onCancel,
}: Props) {
  const isEdit = Boolean(task);
  const { show } = useToast();
  const badges =
    useCached<{ _id: string; title: string; source: string }[]>("/api/badges");

  const [type, setType] = useState<TaskType>("PUZZLE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [xp, setXp] = useState("30");
  const [availableFrom, setAvailableFrom] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [isDailyQuest, setIsDailyQuest] = useState(false);

  const [question, setQuestion] = useState("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [options, setOptions] = useState([
    { id: "a", text: "" },
    { id: "b", text: "" },
  ]);
  const [correct, setCorrect] = useState("a");
  const [explanation, setExplanation] = useState("");
  const [target, setTarget] = useState("5");
  const [attempts, setAttempts] = useState("10");
  const [criteria, setCriteria] = useState("");

  const [badgeMode, setBadgeMode] = useState<BadgeMode>("none");
  const [badgeId, setBadgeId] = useState("");
  const [badgeTitle, setBadgeTitle] = useState("");
  const [badgeXp, setBadgeXp] = useState("50");

  const [assignNow, setAssignNow] = useState(false);
  const [audience, setAudience] = useState<AudienceValue>(DEFAULT_AUDIENCE);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setType(task?.type ?? "PUZZLE");
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setTopicId(task?.skillNodeId ? String(task.skillNodeId) : defaultTopicId);
    setXp(String(task?.xpReward ?? 30));
    setAvailableFrom(isoToDateInput(task?.availableFrom ?? null));
    setDueDate(task?.dueDate ?? null);
    setIsDailyQuest(task?.isDailyQuest ?? false);
    setQuestion(task?.puzzle?.question ?? "");
    setDiagramUrl(task?.puzzle?.diagramUrl ?? "");
    setOptions(
      task?.puzzle?.options?.length
        ? task.puzzle.options
        : [
            { id: "a", text: "" },
            { id: "b", text: "" },
          ],
    );
    setCorrect(task?.puzzle?.correctOptionId ?? "a");
    setExplanation(task?.puzzle?.explanation ?? "");
    setTarget(String(task?.challenge?.targetCount ?? 5));
    setAttempts(String(task?.challenge?.attemptCount ?? 10));
    setCriteria(task?.fieldCheck?.criteria ?? "");
    setBadgeMode(task?.badgeId ? "existing" : "none");
    setBadgeId(task?.badgeId ? String(task.badgeId) : "");
    setErrors({});
  }, [task, defaultTopicId]);

  function addOption() {
    const used = new Set(options.map((o) => o.id));
    const id = [...LETTERS].find((l) => !used.has(l));
    if (id) setOptions([...options, { id, text: "" }]);
  }

  function removeOption(id: string) {
    const next = options.filter((o) => o.id !== id);
    setOptions(next);
    if (correct === id) setCorrect(next[0].id);
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Give the task a title.";
    if (!topicId)
      e.topic = "Every task needs a topic, so it's clear what it teaches.";
    if (!/^\d+$/.test(xp)) e.xp = "Use a whole number, 0 or more.";
    if (!contentLocked) {
      if (type === "PUZZLE") {
        if (!question.trim()) e.question = "Write the question.";
        if (options.some((o) => !o.text.trim()))
          e.options = "Fill in every option, or remove the empty ones.";
      }
      if (type === "CHALLENGE") {
        const t = Number(target);
        const a = Number(attempts);
        if (!(t >= 1) || !(a >= 1))
          e.challenge = "Target and attempts must both be at least 1.";
        else if (t > a)
          e.challenge =
            "The target can't be higher than the number of attempts.";
      }
      if (type === "FIELD_CHECK" && !criteria.trim())
        e.criteria =
          "Describe what a pass looks like, so grading is consistent.";
    }
    if (badgeMode === "existing" && !badgeId)
      e.badge = "Choose a badge, or pick No badge.";
    if (!isEdit && assignNow && !toApiAudience(audience))
      e.audience = "Finish choosing who gets this task.";
    return e;
  }

  function content() {
    if (type === "PUZZLE") {
      return {
        puzzle: {
          question: question.trim(),
          diagramUrl: diagramUrl.trim(),
          options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
          correctOptionId: correct,
          explanation: explanation.trim(),
        },
      };
    }
    if (type === "CHALLENGE")
      return {
        challenge: {
          targetCount: Number(target),
          attemptCount: Number(attempts),
        },
      };
    return { fieldCheck: { criteria: criteria.trim() } };
  }

  async function save(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const common = {
      title: title.trim(),
      description: description.trim(),
      skillNodeId: topicId,
      xpReward: Number(xp),
      availableFrom: availableFrom ? startOfLocalDayISO(availableFrom) : null,
      dueDate,
      isDailyQuest: type === "PUZZLE" ? isDailyQuest : false,
    };

    setSaving(true);
    try {
      let saved: TaskRecord;
      if (!task) {
        const res = await sendJson<{
          task: TaskRecord;
          assignment: Parameters<typeof assignMessage>[0] | null;
        }>("/api/tasks", "POST", {
          type,
          ...common,
          ...content(),
          ...(badgeMode === "existing" ? { badgeId } : {}),
          ...(badgeMode === "new"
            ? {
                createBadge: {
                  title: badgeTitle.trim() || common.title,
                  xpReward: Number(badgeXp) || 0,
                },
              }
            : {}),
          ...(assignNow ? { audience: toApiAudience(audience) } : {}),
        });
        saved = res.task;
        show({
          tone: "success",
          title: `Created “${saved.title}”`,
          detail: badgeMode === "new" ? ["Badge created too."] : [],
        });
        if (res.assignment) show(assignMessage(res.assignment));
      } else {
        let nextBadgeId: string | null =
          badgeMode === "existing" ? badgeId : null;
        if (badgeMode === "new") {
          const created = await sendJson<{ _id: string }>(
            "/api/badges",
            "POST",
            {
              title: badgeTitle.trim() || common.title,
              description: `Passed “${common.title}”`,
              xpReward: Number(badgeXp) || 0,
              source: "TASK",
              skillNodeId: topicId,
              category: "TACTICAL",
            },
          );
          nextBadgeId = created._id;
        }
        saved = await sendJson<TaskRecord>(`/api/tasks/${task._id}`, "PATCH", {
          ...common,
          ...(contentLocked ? {} : content()),
          badgeId: nextBadgeId,
        });
        show({ tone: "success", title: `Saved “${saved.title}”` });
      }
      invalidateAdminData();
      onSaved(saved);
    } catch (err) {
      show(errorMessage(err, "Couldn't save the task"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {!isEdit && (
        <fieldset>
          <legend className={ui.label}>Type</legend>
          <div className="flex flex-wrap gap-2">
            {(["PUZZLE", "FIELD_CHECK", "CHALLENGE"] as const).map((t) => (
              <label
                key={t}
                className={cx(ui.chip(type === t), "cursor-pointer")}
              >
                <input
                  type="radio"
                  name="task-type"
                  className="sr-only"
                  checked={type === t}
                  onChange={() => setType(t)}
                />
                {TASK_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
          <p className={cx(ui.hint, "mt-2")}>
            {type === "PUZZLE" &&
              "Multiple choice. Graded automatically; players get two tries."}
            {type === "FIELD_CHECK" &&
              "You grade each player as Passed or Not yet after training."}
            {type === "CHALLENGE" &&
              "A target over several attempts, like 5 of 10 left-foot finishes. You log each attempt."}
          </p>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="task-title" className={ui.label}>
            Title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Find Zone 14"
            className={ui.input}
          />
          {errors.title && (
            <p className={cx(ui.error, "mt-1")}>{errors.title}</p>
          )}
        </div>
        <TopicPicker
          value={topicId}
          onChange={(id) => setTopicId(id)}
          required
          error={errors.topic}
        />
      </div>

      <div>
        <label htmlFor="task-desc" className={ui.label}>
          Instructions for players (optional)
        </label>
        <textarea
          id="task-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={ui.input}
        />
      </div>

      {contentLocked && (
        <p className="rounded-md border border-[#E0A72F]/40 bg-[#E0A72F]/10 px-4 py-3 font-body text-sm text-[#E0A72F]">
          Players have already worked on this task, so its question and grading
          rules are locked. To change them, archive this task and create a new
          one.
        </p>
      )}

      <fieldset
        disabled={contentLocked}
        className="space-y-4 rounded-lg border border-sky/10 p-4 disabled:opacity-60"
      >
        <legend className="px-1 font-display text-sm font-bold text-mist">
          {TASK_TYPE_LABEL[type]}
        </legend>

        {type === "PUZZLE" && (
          <>
            <div>
              <label htmlFor="pz-q" className={ui.label}>
                Question
              </label>
              <textarea
                id="pz-q"
                rows={2}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className={ui.input}
              />
              {errors.question && (
                <p className={cx(ui.error, "mt-1")}>{errors.question}</p>
              )}
            </div>
            <div>
              <label htmlFor="pz-d" className={ui.label}>
                Diagram link (optional)
              </label>
              <input
                id="pz-d"
                type="url"
                value={diagramUrl}
                onChange={(e) => setDiagramUrl(e.target.value)}
                className={ui.input}
              />
            </div>
            <fieldset>
              <legend className={ui.label}>
                Options (select the correct one)
              </legend>
              <div className="space-y-2">
                {options.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pz-correct"
                      checked={correct === o.id}
                      onChange={() => setCorrect(o.id)}
                      aria-label={`Option ${i + 1} is correct`}
                      className="h-4 w-4 accent-[#1FA97A]"
                    />
                    <input
                      value={o.text}
                      aria-label={`Option ${i + 1}`}
                      onChange={(e) =>
                        setOptions(
                          options.map((x) =>
                            x.id === o.id ? { ...x, text: e.target.value } : x,
                          ),
                        )
                      }
                      className={cx(
                        ui.input,
                        correct === o.id && "border-[#1FA97A]/60",
                      )}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(o.id)}
                        className={cx(button.secondary, button.small)}
                        aria-label={`Remove option ${i + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.options && (
                <p className={cx(ui.error, "mt-1")}>{errors.options}</p>
              )}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className={cx(ui.textButton, ui.focus, "mt-2")}
                >
                  Add an option
                </button>
              )}
            </fieldset>
            <div>
              <label htmlFor="pz-e" className={ui.label}>
                Explanation (shown after they finish)
              </label>
              <textarea
                id="pz-e"
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className={ui.input}
              />
            </div>
          </>
        )}

        {type === "CHALLENGE" && (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ch-t" className={ui.label}>
                  Target (successes needed)
                </label>
                <input
                  id="ch-t"
                  inputMode="numeric"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={ui.input}
                />
              </div>
              <div>
                <label htmlFor="ch-a" className={ui.label}>
                  Attempts allowed
                </label>
                <input
                  id="ch-a"
                  inputMode="numeric"
                  value={attempts}
                  onChange={(e) => setAttempts(e.target.value)}
                  className={ui.input}
                />
              </div>
            </div>
            {errors.challenge && (
              <p className={cx(ui.error, "mt-1")}>{errors.challenge}</p>
            )}
          </div>
        )}

        {type === "FIELD_CHECK" && (
          <div>
            <label htmlFor="fc-c" className={ui.label}>
              What a pass looks like
            </label>
            <textarea
              id="fc-c"
              rows={3}
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Receives in Zone 14 facing forward at least twice in the drill"
              className={ui.input}
            />
            {errors.criteria && (
              <p className={cx(ui.error, "mt-1")}>{errors.criteria}</p>
            )}
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[8rem_12rem_1fr]">
        <div>
          <label htmlFor="task-xp" className={ui.label}>
            XP
          </label>
          <input
            id="task-xp"
            inputMode="numeric"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
            className={ui.input}
          />
          {errors.xp && <p className={cx(ui.error, "mt-1")}>{errors.xp}</p>}
        </div>
        <div>
          <label htmlFor="task-from" className={ui.label}>
            Available from
          </label>
          <input
            id="task-from"
            type="date"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
            className={cx(ui.input, "[color-scheme:dark]")}
          />
        </div>
        <DueDatePicker
          value={dueDate}
          onChange={setDueDate}
          allowPast={isEdit}
        />
      </div>

      {type === "PUZZLE" && (
        <label className="flex items-center gap-2 font-body text-sm text-sky/80">
          <input
            type="checkbox"
            checked={isDailyQuest}
            onChange={(e) => setIsDailyQuest(e.target.checked)}
            className="h-4 w-4 accent-[#018ABE]"
          />
          Daily quest
        </label>
      )}

      <fieldset className="space-y-3">
        <legend className={ui.label}>Badge</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["none", "No badge"],
              ["existing", "Use an existing badge"],
              ["new", "Create a badge"],
            ] as const
          ).map(([mode, label]) => (
            <label
              key={mode}
              className={cx(ui.chip(badgeMode === mode), "cursor-pointer")}
            >
              <input
                type="radio"
                name="badge-mode"
                className="sr-only"
                checked={badgeMode === mode}
                onChange={() => setBadgeMode(mode)}
              />
              {label}
            </label>
          ))}
        </div>
        {badgeMode === "existing" && (
          <select
            aria-label="Badge"
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            className={ui.input}
          >
            <option value="">Choose a badge</option>
            {(badges.data ?? []).map((b) => (
              <option key={b._id} value={b._id}>
                {b.title}
              </option>
            ))}
          </select>
        )}
        {badgeMode === "new" && (
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <div>
              <label htmlFor="nb-title" className={ui.label}>
                Badge name
              </label>
              <input
                id="nb-title"
                value={badgeTitle}
                onChange={(e) => setBadgeTitle(e.target.value)}
                placeholder={title || "Same as the task"}
                className={ui.input}
              />
            </div>
            <div>
              <label htmlFor="nb-xp" className={ui.label}>
                Badge XP
              </label>
              <input
                id="nb-xp"
                inputMode="numeric"
                value={badgeXp}
                onChange={(e) => setBadgeXp(e.target.value)}
                className={ui.input}
              />
            </div>
          </div>
        )}
        {errors.badge && <p className={ui.error}>{errors.badge}</p>}
        {badgeMode !== "none" && (
          <p className={ui.hint}>
            Players get the badge when they pass this task.
          </p>
        )}
      </fieldset>

      {!isEdit && (
        <fieldset className="space-y-3 rounded-lg border border-sky/10 p-4">
          <label className="flex items-center gap-2 font-body text-sm text-mist">
            <input
              type="checkbox"
              checked={assignNow}
              onChange={(e) => setAssignNow(e.target.checked)}
              className="h-4 w-4 accent-[#018ABE]"
            />
            Assign it now
          </label>
          {assignNow && (
            <AudiencePicker value={audience} onChange={setAudience} />
          )}
          {errors.audience && <p className={ui.error}>{errors.audience}</p>}
          {!assignNow && (
            <p className={ui.hint}>
              You can assign it later from the task page.
            </p>
          )}
        </fieldset>
      )}

      <div className="flex justify-end gap-2 border-t border-sky/10 pt-5">
        {onCancel && (
          <button type="button" onClick={onCancel} className={button.secondary}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className={button.primary}>
          {saving
            ? "Saving…"
            : isEdit
              ? "Save task"
              : assignNow
                ? "Create and assign"
                : "Create task"}
        </button>
      </div>
    </form>
  );
}
