import { Types, FilterQuery } from "mongoose";
import Task, { ITask, TASK_TYPES, TaskType } from "@/lib/models/Task";
import TaskAssignment, {
  ITaskAssignment,
  AssignmentStatus,
} from "@/lib/models/TaskAssignment";
import Badge from "@/lib/models/Badge";
import SkillNode from "@/lib/models/SkillNode";
import { Audience, parseAudience, resolveAudience } from "./audience";
import { awardBadge, AwardedBadge } from "./badges";
import {
  markTopicInProgress,
  openTopicForPlayers,
  OpenResult,
} from "./progress";
import { Lean } from "./types";
import { LearningError, parseOptionalDate, toObjectId } from "./errors";
import { awardXp } from "./rewards";

export const MAX_PUZZLE_ATTEMPTS = 2;

const ACTIVE: AssignmentStatus[] = ["ASSIGNED", "IN_PROGRESS"];
const FINISHED: AssignmentStatus[] = ["PASSED", "NOT_YET"];

type LeanTask = Lean<ITask>;
type LeanAssignment = Lean<ITaskAssignment>;

const CONTENT_KEY: Record<TaskType, "puzzle" | "challenge" | "fieldCheck"> = {
  PUZZLE: "puzzle",
  CHALLENGE: "challenge",
  FIELD_CHECK: "fieldCheck",
};

function isTaskType(value: unknown): value is TaskType {
  return (
    typeof value === "string" &&
    (TASK_TYPES as readonly string[]).includes(value)
  );
}

function effectiveDue(
  a: { dueDate?: Date | null },
  t: { dueDate?: Date | null },
): Date | null {
  return a.dueDate ?? t.dueDate ?? null;
}

async function assertActiveBadge(badgeId: Types.ObjectId): Promise<void> {
  const badge = await Badge.findById(badgeId)
    .select("isArchived")
    .lean<{ isArchived: boolean }>();
  if (!badge || badge.isArchived)
    throw new LearningError("Badge not found", 404);
}

// ---------------------------------------------------------------------------
// Creating, editing and assigning (step 12)
// ---------------------------------------------------------------------------

export interface AssignResult {
  assigned: number;
  alreadyAssigned: number;
  topic: OpenResult;
}

/**
 * Creates one assignment per player in the audience. Players who already have
 * this task are skipped. The task's topic is opened for anyone it was Locked for.
 */
export async function assignTask(
  taskId: Types.ObjectId,
  audience: Audience,
  coachId: Types.ObjectId | null,
  dueDate: Date | null,
): Promise<AssignResult> {
  const task = await Task.findById(taskId)
    .select("isArchived skillNodeId")
    .lean<LeanTask>();
  if (!task) throw new LearningError("Task not found", 404);
  if (task.isArchived) throw new LearningError("This task is archived", 400);

  const recipients = await resolveAudience(audience);
  const res = await TaskAssignment.bulkWrite(
    recipients.map((r) => ({
      updateOne: {
        filter: { taskId: task._id, playerId: r.playerId },
        update: {
          $setOnInsert: {
            source: r.source,
            status: "ASSIGNED",
            dueDate,
            puzzleAnswers: [],
            challengeLog: [],
            progressCount: 0,
            grade: null,
            completedAt: null,
            xpAwarded: false,
            assignedBy: coachId,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  const topic = await openTopicForPlayers(
    task.skillNodeId,
    recipients.map((r) => r.playerId),
    coachId,
  );

  return {
    assigned: res.upsertedCount,
    alreadyAssigned: recipients.length - res.upsertedCount,
    topic,
  };
}

/**
 * Creates a task. Optional extras in the body:
 * - `badgeId`: link an existing badge
 * - `createBadge`: true, or { title, description, iconUrl, xpReward }, to create a TASK badge
 * - `audience` (+ `assignmentDueDate`): assign straight away
 */
export async function createTask(
  body: Record<string, unknown>,
  coachId: Types.ObjectId | null,
) {
  if (!isTaskType(body.type)) {
    throw new LearningError(
      "type must be PUZZLE, FIELD_CHECK or CHALLENGE",
      400,
    );
  }
  const type = body.type;
  const skillNodeId = toObjectId(body.skillNodeId, "skillNodeId");
  if (!(await SkillNode.exists({ _id: skillNodeId })))
    throw new LearningError("Topic not found", 404);

  // Parse everything that can fail before anything is written.
  const audience = body.audience ? parseAudience(body.audience) : null;
  const assignmentDueDate = parseOptionalDate(
    body.assignmentDueDate,
    "assignmentDueDate",
  );
  const existingBadgeId = body.badgeId
    ? toObjectId(body.badgeId, "badgeId")
    : null;
  if (existingBadgeId) await assertActiveBadge(existingBadgeId);

  const contentKey = CONTENT_KEY[type];
  const task = new Task({
    type,
    skillNodeId,
    title: body.title,
    description: body.description ?? "",
    xpReward: body.xpReward ?? 30,
    availableFrom: parseOptionalDate(body.availableFrom, "availableFrom"),
    dueDate: parseOptionalDate(body.dueDate, "dueDate"),
    isDailyQuest: Boolean(body.isDailyQuest),
    [contentKey]: body[contentKey],
    badgeId: existingBadgeId,
    createdBy: coachId,
  });
  await task.validate();

  let createdBadgeId: Types.ObjectId | null = null;
  if (!existingBadgeId && body.createBadge) {
    const opts =
      typeof body.createBadge === "object" && body.createBadge !== null
        ? (body.createBadge as Record<string, unknown>)
        : {};
    const text = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : null;
    const badge = await Badge.create({
      title: text(opts.title) ?? task.title,
      description: text(opts.description) ?? `Passed "${task.title}"`,
      iconUrl: text(opts.iconUrl),
      category: "TACTICAL",
      xpReward: typeof opts.xpReward === "number" ? opts.xpReward : 50,
      source: "TASK",
      skillNodeId,
    });
    createdBadgeId = badge._id as Types.ObjectId;
    task.badgeId = createdBadgeId;
  }

  try {
    await task.save();
  } catch (err) {
    if (createdBadgeId) await Badge.deleteOne({ _id: createdBadgeId });
    throw err;
  }

  const assignment = audience
    ? await assignTask(
        task._id as Types.ObjectId,
        audience,
        coachId,
        assignmentDueDate,
      )
    : null;

  return { task: task.toObject(), assignment };
}

export async function updateTask(
  taskId: Types.ObjectId,
  body: Record<string, unknown>,
) {
  const task = await Task.findById(taskId);
  if (!task) throw new LearningError("Task not found", 404);

  if ("type" in body && body.type !== task.type) {
    throw new LearningError(
      "A task's type can't be changed. Create a new task instead.",
      400,
    );
  }

  if ("skillNodeId" in body) {
    const nodeId = toObjectId(body.skillNodeId, "skillNodeId");
    if (!nodeId.equals(task.skillNodeId)) {
      if (await TaskAssignment.exists({ taskId })) {
        throw new LearningError(
          "This task is already assigned, so it can't move to another topic",
          409,
        );
      }
      if (!(await SkillNode.exists({ _id: nodeId })))
        throw new LearningError("Topic not found", 404);
      task.skillNodeId = nodeId;
    }
  }

  const contentKey = CONTENT_KEY[task.type];
  if (contentKey in body) {
    const started = await TaskAssignment.exists({
      taskId,
      $or: [
        { "puzzleAnswers.0": { $exists: true } },
        { "challengeLog.0": { $exists: true } },
        { "grade.gradedAt": { $ne: null } },
      ],
    });
    if (started) {
      throw new LearningError(
        "Players have already worked on this task, so its content can't change. Archive it and create a new one.",
        409,
      );
    }
    task.set(contentKey, body[contentKey]);
  }

  for (const key of [
    "title",
    "description",
    "xpReward",
    "isDailyQuest",
  ] as const) {
    if (key in body) task.set(key, body[key]);
  }
  if ("availableFrom" in body)
    task.availableFrom = parseOptionalDate(body.availableFrom, "availableFrom");
  if ("dueDate" in body)
    task.dueDate = parseOptionalDate(body.dueDate, "dueDate");
  if ("badgeId" in body) {
    if (body.badgeId === null || body.badgeId === "") {
      task.badgeId = null;
    } else {
      const badgeId = toObjectId(body.badgeId, "badgeId");
      await assertActiveBadge(badgeId);
      task.badgeId = badgeId;
    }
  }

  await task.save();
  return task.toObject();
}

/** Archived tasks disappear from players' feeds; their history is kept. */
export async function archiveTask(taskId: Types.ObjectId): Promise<void> {
  const res = await Task.updateOne(
    { _id: taskId },
    { $set: { isArchived: true } },
  );
  if (res.matchedCount === 0) throw new LearningError("Task not found", 404);
}

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

/**
 * Marks active assignments past their due date as EXPIRED. Runs lazily whenever
 * assignments are read, so no cron job is needed.
 */
export async function expireOverdue(
  match: FilterQuery<ITaskAssignment>,
): Promise<number> {
  const active = await TaskAssignment.find({
    ...match,
    status: { $in: ACTIVE },
  })
    .select("_id taskId dueDate")
    .lean<
      { _id: Types.ObjectId; taskId: Types.ObjectId; dueDate: Date | null }[]
    >();
  if (active.length === 0) return 0;

  const taskIds = [...new Set(active.map((a) => String(a.taskId)))].map(
    (id) => new Types.ObjectId(id),
  );
  const tasks = await Task.find({ _id: { $in: taskIds } })
    .select("dueDate")
    .lean<{ _id: Types.ObjectId; dueDate: Date | null }[]>();
  const taskDue = new Map(tasks.map((t) => [String(t._id), t.dueDate]));

  const now = new Date();
  const overdue = active
    .filter((a) => {
      const due = a.dueDate ?? taskDue.get(String(a.taskId)) ?? null;
      return due !== null && due < now;
    })
    .map((a) => a._id);
  if (overdue.length === 0) return 0;

  const res = await TaskAssignment.updateMany(
    { _id: { $in: overdue }, status: { $in: ACTIVE } },
    { $set: { status: "EXPIRED" } },
  );
  return res.modifiedCount;
}

// ---------------------------------------------------------------------------
// Grading (step 13)
// ---------------------------------------------------------------------------

export interface PassRewards {
  xp: number;
  badge: AwardedBadge | null;
}

/** XP is claimed with an atomic flag, so it can only ever be added once. */
async function grantPassRewards(
  assignmentId: Types.ObjectId,
  playerId: Types.ObjectId,
  task: LeanTask,
): Promise<PassRewards> {
  const claim = await TaskAssignment.updateOne(
    { _id: assignmentId, xpAwarded: false },
    { $set: { xpAwarded: true } },
  );
  let xp = 0;
  if (claim.modifiedCount === 1 && task.xpReward > 0) {
    await awardXp(playerId, task.xpReward);
    xp = task.xpReward;
  }

  let badge: AwardedBadge | null = null;
  if (task.badgeId) {
    try {
      badge = await awardBadge(playerId, task.badgeId, {
        awardSource: "AUTO",
        taskAssignmentId: assignmentId,
      });
    } catch (err) {
      // An archived or deleted badge shouldn't fail the player's pass.
      if (!(err instanceof LearningError)) throw err;
    }
  }
  return { xp, badge };
}

async function loadAssignmentAndTask(assignmentId: Types.ObjectId) {
  const assignment =
    await TaskAssignment.findById(assignmentId).lean<LeanAssignment>();
  if (!assignment) throw new LearningError("Assignment not found", 404);
  const task = await Task.findById(assignment.taskId).lean<LeanTask>();
  if (!task) throw new LearningError("Task not found", 404);
  return { assignment, task };
}

async function assertOpenForWork(
  a: LeanAssignment,
  t: LeanTask,
): Promise<void> {
  if (t.isArchived) throw new LearningError("This task has been archived", 410);
  if (t.availableFrom && t.availableFrom > new Date()) {
    throw new LearningError("This task isn't available yet", 403);
  }
  if (a.status === "EXPIRED")
    throw new LearningError("This task has expired", 400);
  if (FINISHED.includes(a.status))
    throw new LearningError("This task is already finished", 409);
  const due = effectiveDue(a, t);
  if (due && due < new Date()) {
    await TaskAssignment.updateOne(
      { _id: a._id, status: { $in: ACTIVE } },
      { $set: { status: "EXPIRED" } },
    );
    throw new LearningError("This task has expired", 400);
  }
}

/** A player answers a puzzle. Players get MAX_PUZZLE_ATTEMPTS tries. */
export async function submitPuzzleAnswer(
  assignmentId: Types.ObjectId,
  playerId: Types.ObjectId,
  optionId: unknown,
) {
  if (typeof optionId !== "string" || !optionId)
    throw new LearningError("optionId is required", 400);

  const { assignment: a, task: t } = await loadAssignmentAndTask(assignmentId);
  if (!a.playerId.equals(playerId))
    throw new LearningError("This task isn't assigned to you", 403);
  if (t.type !== "PUZZLE" || !t.puzzle)
    throw new LearningError("This task is not a puzzle", 400);
  await assertOpenForWork(a, t);
  if (!t.puzzle.options.some((o) => o.id === optionId))
    throw new LearningError("Unknown option", 400);

  const attemptsBefore = a.puzzleAnswers?.length ?? 0;
  const attempts = attemptsBefore + 1;
  const isCorrect = optionId === t.puzzle.correctOptionId;
  const status: AssignmentStatus = isCorrect
    ? "PASSED"
    : attempts >= MAX_PUZZLE_ATTEMPTS
      ? "NOT_YET"
      : "IN_PROGRESS";
  const finished = status !== "IN_PROGRESS";

  // The $size condition rejects a double-tap that would record two answers.
  const updated = await TaskAssignment.findOneAndUpdate(
    {
      _id: a._id,
      status: { $in: ACTIVE },
      puzzleAnswers: { $size: attemptsBefore },
    },
    {
      $push: { puzzleAnswers: { optionId, isCorrect, answeredAt: new Date() } },
      $set: { status, completedAt: finished ? new Date() : null },
    },
    { new: true },
  ).lean<LeanAssignment>();
  if (!updated)
    throw new LearningError(
      "That answer was already submitted. Refresh and try again.",
      409,
    );

  await markTopicInProgress(playerId, t.skillNodeId);
  const rewards =
    status === "PASSED" ? await grantPassRewards(a._id, playerId, t) : null;

  return {
    status,
    isCorrect,
    attemptsUsed: attempts,
    attemptsLeft: finished ? 0 : MAX_PUZZLE_ATTEMPTS - attempts,
    // The answer is only revealed once the puzzle is finished.
    correctOptionId: finished ? t.puzzle.correctOptionId : null,
    explanation: finished ? t.puzzle.explanation : null,
    rewards,
  };
}

/**
 * Coach grades a field check for many players at once. Re-grading is allowed
 * (e.g. Not yet → Passed next week), and works even after the due date.
 */
export async function gradeFieldCheck(
  taskId: Types.ObjectId,
  gradesInput: unknown,
  coachId: Types.ObjectId | null,
) {
  const t = await Task.findById(taskId).lean<LeanTask>();
  if (!t) throw new LearningError("Task not found", 404);
  if (t.type !== "FIELD_CHECK")
    throw new LearningError("This task is not a field check", 400);
  if (t.isArchived) throw new LearningError("This task has been archived", 410);
  if (!Array.isArray(gradesInput) || gradesInput.length === 0) {
    throw new LearningError("grades must be a non-empty array", 400);
  }
  if (gradesInput.length > 100)
    throw new LearningError("Grade at most 100 players at a time", 400);

  const results: {
    playerId: string;
    ok: boolean;
    status?: AssignmentStatus;
    rewards?: PassRewards | null;
    error?: string;
  }[] = [];

  for (const raw of gradesInput) {
    const g = (raw ?? {}) as Record<string, unknown>;
    let playerId: Types.ObjectId;
    try {
      playerId = toObjectId(g.playerId, "playerId");
    } catch {
      results.push({
        playerId: String(g.playerId),
        ok: false,
        error: "Invalid playerId",
      });
      continue;
    }
    if (g.result !== "PASSED" && g.result !== "NOT_YET") {
      results.push({
        playerId: String(playerId),
        ok: false,
        error: "result must be PASSED or NOT_YET",
      });
      continue;
    }

    const now = new Date();
    const updated = await TaskAssignment.findOneAndUpdate(
      { taskId: t._id, playerId },
      {
        $set: {
          status: g.result,
          grade: {
            note: typeof g.note === "string" ? g.note.trim() : "",
            gradedBy: coachId,
            gradedAt: now,
          },
          completedAt: now,
        },
      },
      { new: true },
    ).lean<LeanAssignment>();
    if (!updated) {
      results.push({
        playerId: String(playerId),
        ok: false,
        error: "This player isn't assigned this field check",
      });
      continue;
    }

    await markTopicInProgress(playerId, t.skillNodeId);
    const rewards =
      g.result === "PASSED"
        ? await grantPassRewards(updated._id, playerId, t)
        : null;
    results.push({
      playerId: String(playerId),
      ok: true,
      status: g.result,
      rewards,
    });
  }

  return { results };
}

/** Coach logs one attempt on a player's challenge. */
export async function logChallengeAttempt(
  assignmentId: Types.ObjectId,
  body: Record<string, unknown>,
) {
  if (typeof body.success !== "boolean")
    throw new LearningError("success must be true or false", 400);
  const success = body.success;
  const note = typeof body.note === "string" ? body.note.trim() : "";

  const { assignment: a, task: t } = await loadAssignmentAndTask(assignmentId);
  if (t.type !== "CHALLENGE" || !t.challenge)
    throw new LearningError("This task is not a challenge", 400);
  await assertOpenForWork(a, t);

  const { targetCount, attemptCount } = t.challenge;
  const logBefore = a.challengeLog?.length ?? 0;
  const attemptsUsed = logBefore + 1;
  const progressCount = (a.progressCount ?? 0) + (success ? 1 : 0);
  const stillNeeded = targetCount - progressCount;
  const attemptsLeft = Math.max(0, attemptCount - attemptsUsed);

  // NOT_YET as soon as the target is out of reach, not only after the last attempt.
  const status: AssignmentStatus =
    progressCount >= targetCount
      ? "PASSED"
      : stillNeeded > attemptsLeft
        ? "NOT_YET"
        : "IN_PROGRESS";
  const finished = status !== "IN_PROGRESS";

  const updated = await TaskAssignment.findOneAndUpdate(
    { _id: a._id, status: { $in: ACTIVE }, challengeLog: { $size: logBefore } },
    {
      $push: { challengeLog: { date: new Date(), success, note } },
      $set: {
        progressCount,
        status,
        completedAt: finished ? new Date() : null,
      },
    },
    { new: true },
  ).lean<LeanAssignment>();
  if (!updated)
    throw new LearningError(
      "That attempt was already logged. Refresh and try again.",
      409,
    );

  await markTopicInProgress(a.playerId, t.skillNodeId);
  const rewards =
    status === "PASSED" ? await grantPassRewards(a._id, a.playerId, t) : null;

  return {
    status,
    progressCount,
    targetCount,
    attemptsUsed,
    attemptsLeft,
    rewards,
  };
}

// ---------------------------------------------------------------------------
// Reading (coach lists and step 17's player feed)
// ---------------------------------------------------------------------------

/** A task as a player may see it: no puzzle answer until they've finished. */
export function taskForPlayer(t: LeanTask, status: AssignmentStatus) {
  const base = {
    _id: String(t._id),
    type: t.type,
    title: t.title,
    description: t.description,
    xpReward: t.xpReward,
    isDailyQuest: t.isDailyQuest,
    skillNodeId: String(t.skillNodeId),
    hasBadge: Boolean(t.badgeId),
  };
  if (t.type === "PUZZLE" && t.puzzle) {
    const { question, diagramUrl, options } = t.puzzle;
    return {
      ...base,
      puzzle: FINISHED.includes(status)
        ? t.puzzle
        : { question, diagramUrl, options },
    };
  }
  if (t.type === "CHALLENGE") return { ...base, challenge: t.challenge };
  return { ...base, fieldCheck: t.fieldCheck };
}

function progressSummary(a: LeanAssignment, t: LeanTask) {
  if (t.type === "PUZZLE") {
    const used = a.puzzleAnswers?.length ?? 0;
    return {
      attemptsUsed: used,
      attemptsLeft: ACTIVE.includes(a.status) ? MAX_PUZZLE_ATTEMPTS - used : 0,
    };
  }
  if (t.type === "CHALLENGE" && t.challenge) {
    const used = a.challengeLog?.length ?? 0;
    return {
      progressCount: a.progressCount ?? 0,
      targetCount: t.challenge.targetCount,
      attemptsUsed: used,
      attemptsLeft: Math.max(0, t.challenge.attemptCount - used),
    };
  }
  return { gradeNote: a.grade?.note ?? null };
}

export type FeedFilter = "active" | "done" | "all";

export async function listPlayerTasks(
  playerId: Types.ObjectId,
  filter: FeedFilter = "all",
) {
  await expireOverdue({ playerId });

  const assignments = await TaskAssignment.find({ playerId }).lean<
    LeanAssignment[]
  >();
  if (assignments.length === 0) return [];

  const taskIds = [...new Set(assignments.map((a) => String(a.taskId)))].map(
    (id) => new Types.ObjectId(id),
  );
  const tasks = await Task.find({
    _id: { $in: taskIds },
    isArchived: false,
  }).lean<LeanTask[]>();
  const taskById = new Map(tasks.map((t) => [String(t._id), t]));

  const nodeIds = [...new Set(tasks.map((t) => String(t.skillNodeId)))].map(
    (id) => new Types.ObjectId(id),
  );
  const nodes = await SkillNode.find({ _id: { $in: nodeIds } })
    .select("title titleEn moduleId")
    .lean<
      {
        _id: Types.ObjectId;
        title: string;
        titleEn?: string;
        moduleId?: Types.ObjectId | null;
      }[]
    >();
  const nodeById = new Map(nodes.map((n) => [String(n._id), n]));

  const now = new Date();
  const items = assignments.flatMap((a) => {
    const t = taskById.get(String(a.taskId));
    if (!t) return [];
    if (t.availableFrom && t.availableFrom > now) return [];
    const isActive = ACTIVE.includes(a.status);
    if (filter === "active" && !isActive) return [];
    if (filter === "done" && isActive) return [];
    const node = nodeById.get(String(t.skillNodeId));
    return [
      {
        assignmentId: String(a._id),
        status: a.status,
        isActive,
        dueDate: effectiveDue(a, t),
        completedAt: a.completedAt ?? null,
        progress: progressSummary(a, t),
        task: taskForPlayer(t, a.status),
        topic: node
          ? {
              id: String(node._id),
              title: node.title,
              titleEn: node.titleEn ?? "",
              moduleId: node.moduleId ? String(node.moduleId) : null,
            }
          : null,
      },
    ];
  });

  // Active first, soonest due first (no due date last); then most recently finished.
  return items.sort((x, y) => {
    if (x.isActive !== y.isActive) return x.isActive ? -1 : 1;
    if (x.isActive) {
      const dx = x.dueDate ? x.dueDate.getTime() : Number.POSITIVE_INFINITY;
      const dy = y.dueDate ? y.dueDate.getTime() : Number.POSITIVE_INFINITY;
      return dx - dy;
    }
    return (y.completedAt?.getTime() ?? 0) - (x.completedAt?.getTime() ?? 0);
  });
}

/** Coach list of tasks with per-status counts. */
export async function listTasks(filters: {
  skillNodeId?: Types.ObjectId;
  type?: unknown;
  includeArchived?: boolean;
}) {
  const query: FilterQuery<ITask> = {};
  if (filters.skillNodeId) query.skillNodeId = filters.skillNodeId;
  if (filters.type !== undefined) {
    if (!isTaskType(filters.type))
      throw new LearningError("Unknown task type", 400);
    query.type = filters.type;
  }
  if (!filters.includeArchived) query.isArchived = false;

  const tasks = await Task.find(query)
    .sort({ createdAt: -1 })
    .lean<LeanTask[]>();
  if (tasks.length === 0) return [];

  await expireOverdue({ taskId: { $in: tasks.map((t) => t._id) } });
  const counts = await TaskAssignment.aggregate<{
    _id: { taskId: Types.ObjectId; status: AssignmentStatus };
    n: number;
  }>([
    { $match: { taskId: { $in: tasks.map((t) => t._id) } } },
    {
      $group: { _id: { taskId: "$taskId", status: "$status" }, n: { $sum: 1 } },
    },
  ]);

  const stats = new Map<string, Record<AssignmentStatus | "total", number>>();
  for (const row of counts) {
    const key = String(row._id.taskId);
    const s = stats.get(key) ?? {
      total: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      PASSED: 0,
      NOT_YET: 0,
      EXPIRED: 0,
    };
    s[row._id.status] += row.n;
    s.total += row.n;
    stats.set(key, s);
  }

  return tasks.map((t) => ({
    ...t,
    stats: stats.get(String(t._id)) ?? {
      total: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      PASSED: 0,
      NOT_YET: 0,
      EXPIRED: 0,
    },
  }));
}

/** Coach view of who has a task and how they're doing (grading screen). */
export async function listTaskAssignments(taskId: Types.ObjectId) {
  const task = await Task.findById(taskId).lean<LeanTask>();
  if (!task) throw new LearningError("Task not found", 404);
  await expireOverdue({ taskId });

  const assignments = await TaskAssignment.find({ taskId })
    .populate("playerId", "name surname number position")
    .sort({ createdAt: 1 })
    .lean();

  return { task, assignments };
}
