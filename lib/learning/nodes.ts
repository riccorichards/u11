// Path: lib/learning/nodes.ts

import { Types } from "mongoose";
import SkillNode, { ISkillNode } from "@/lib/models/SkillNode";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";
import Module from "@/lib/models/Module";
import Task from "@/lib/models/Task";
import Badge from "@/lib/models/Badge";
import { LearningError, toObjectId, toObjectIds } from "./errors";

type Row = {
  _id: Types.ObjectId;
  moduleId?: Types.ObjectId | null;
  parentId?: Types.ObjectId | null;
  prerequisites?: Types.ObjectId[];
  tierLevel?: number;
};

function cleanLesson(input: unknown) {
  const l = (input ?? {}) as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const keyPoints = Array.isArray(l.keyPoints)
    ? l.keyPoints.map(text).filter(Boolean)
    : [];
  if (keyPoints.length > 5)
    throw new LearningError("A lesson can have at most 5 key points", 400);
  return {
    videoUrl: text(l.videoUrl),
    diagramUrl: text(l.diagramUrl),
    keyPoints,
  };
}

/** True if `targetId` can be reached from `startIds` by following prerequisite links. */
function reachesViaPrerequisites(
  startIds: string[],
  targetId: string,
  all: Row[],
): boolean {
  const byId = new Map(all.map((n) => [String(n._id), n]));
  const stack = [...startIds];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === targetId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const p of byId.get(id)?.prerequisites ?? []) stack.push(String(p));
  }
  return false;
}

function isDescendant(candidateId: string, ofId: string, all: Row[]): boolean {
  const byId = new Map(all.map((n) => [String(n._id), n]));
  let current = byId.get(candidateId);
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(String(current._id))) {
    seen.add(String(current._id));
    if (String(current.parentId) === ofId) return true;
    current = byId.get(String(current.parentId));
  }
  return false;
}

async function resolveParent(
  parentInput: unknown,
  moduleId: Types.ObjectId,
  selfId: string | null,
  all: Row[],
) {
  if (parentInput === null || parentInput === undefined || parentInput === "")
    return { parentId: null, tierLevel: 1 };
  const parentId = toObjectId(parentInput, "parentId");
  const parent = all.find((n) => n._id.equals(parentId));
  if (!parent) throw new LearningError("Parent topic not found", 404);
  if (!parent.moduleId || !parent.moduleId.equals(moduleId)) {
    throw new LearningError("The parent topic must be in the same module", 400);
  }
  if (
    selfId &&
    (String(parentId) === selfId || isDescendant(String(parentId), selfId, all))
  ) {
    throw new LearningError(
      "A topic can't be placed under itself or one of its own subtopics",
      400,
    );
  }
  return { parentId, tierLevel: (parent.tierLevel ?? 1) + 1 };
}

function resolvePrerequisites(
  input: unknown,
  selfId: string | null,
  all: Row[],
): Types.ObjectId[] {
  const ids = toObjectIds(input ?? [], "prerequisites");
  for (const id of ids) {
    if (!all.some((n) => n._id.equals(id)))
      throw new LearningError("A prerequisite topic was not found", 404);
    if (selfId && String(id) === selfId)
      throw new LearningError("A topic can't be its own prerequisite", 400);
  }
  if (selfId && reachesViaPrerequisites(ids.map(String), selfId, all)) {
    throw new LearningError(
      "These prerequisites would create a loop (A needs B, B needs A)",
      400,
    );
  }
  return ids;
}

async function loadAll(): Promise<Row[]> {
  return SkillNode.find({})
    .select("_id moduleId parentId prerequisites tierLevel")
    .lean<Row[]>();
}

export async function createNode(body: Record<string, unknown>) {
  const moduleId = toObjectId(body.moduleId, "moduleId");
  if (!(await Module.exists({ _id: moduleId })))
    throw new LearningError("Module not found", 404);
  const all = await loadAll();
  const { parentId, tierLevel } = await resolveParent(
    body.parentId,
    moduleId,
    null,
    all,
  );

  let sequenceOrder =
    typeof body.sequenceOrder === "number" ? body.sequenceOrder : undefined;
  if (sequenceOrder === undefined) {
    const last = await SkillNode.findOne({ moduleId, parentId })
      .sort({ sequenceOrder: -1 })
      .select("sequenceOrder")
      .lean<{ sequenceOrder?: number }>();
    sequenceOrder = (last?.sequenceOrder ?? -1) + 1;
  }

  const node = await SkillNode.create({
    title: body.title,
    titleEn: body.titleEn ?? "",
    description: body.description ?? "",
    moduleId,
    parentId,
    tierLevel,
    sequenceOrder,
    positions: body.positions ?? ["ALL"],
    levels: body.levels ?? ["U11"],
    prerequisites: resolvePrerequisites(body.prerequisites, null, all),
    lesson: cleanLesson(body.lesson),
  });
  return node.toObject();
}

export async function updateNode(
  id: Types.ObjectId,
  body: Record<string, unknown>,
) {
  const node = await SkillNode.findById(id);
  if (!node) throw new LearningError("Topic not found", 404);
  const all = await loadAll();
  const selfId = String(id);

  let moduleId = node.moduleId as Types.ObjectId | null;
  if ("moduleId" in body) {
    const next = toObjectId(body.moduleId, "moduleId");
    if (!moduleId || !next.equals(moduleId)) {
      if (!(await Module.exists({ _id: next })))
        throw new LearningError("Module not found", 404);
      if (all.some((n) => n.parentId && String(n.parentId) === selfId)) {
        throw new LearningError(
          "Move this topic's subtopics first, then move the topic",
          409,
        );
      }
      moduleId = next;
      node.moduleId = next;
      if (!("parentId" in body)) {
        node.parentId = null;
        node.tierLevel = 1;
      }
    }
  }

  if ("parentId" in body) {
    if (!moduleId)
      throw new LearningError("Put this topic in a module first", 400);
    const { parentId, tierLevel } = await resolveParent(
      body.parentId,
      moduleId,
      selfId,
      all,
    );
    node.parentId = parentId;
    node.tierLevel = tierLevel;
  }

  for (const key of [
    "title",
    "titleEn",
    "description",
    "sequenceOrder",
    "positions",
    "levels",
  ] as const) {
    if (key in body) node.set(key, body[key]);
  }
  if ("prerequisites" in body)
    node.prerequisites = resolvePrerequisites(body.prerequisites, selfId, all);
  if ("lesson" in body) node.set("lesson", cleanLesson(body.lesson));

  await node.save();
  return node.toObject();
}

/**
 * Deletes a topic. Its subtopics move up to its parent. Blocked while tasks or
 * active badges point at it, so nothing is left without a topic.
 */
export async function deleteNode(id: Types.ObjectId) {
  const node = await SkillNode.findById(id).lean<
    ISkillNode & { _id: Types.ObjectId }
  >();
  if (!node) throw new LearningError("Topic not found", 404);
  if (await Task.exists({ skillNodeId: id, isArchived: false })) {
    throw new LearningError(
      "This topic still has tasks. Archive or move them first.",
      409,
    );
  }
  if (await Badge.exists({ skillNodeId: id, isArchived: false })) {
    throw new LearningError(
      "This topic still has badges. Archive or relink them first.",
      409,
    );
  }

  await SkillNode.updateMany(
    { parentId: id },
    { $set: { parentId: node.parentId ?? null } },
  );
  await SkillNode.updateMany(
    { prerequisites: id },
    { $pull: { prerequisites: id } },
  );
  await SkillNodeProgress.deleteMany({ nodeId: id });
  await SkillNode.deleteOne({ _id: id });
}
