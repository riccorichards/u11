// Path: lib/learning/playerTopics.ts

import { Types } from "mongoose";
import SkillNode from "@/lib/models/SkillNode";
import SkillNodeProgress, {
  ProgressStatus,
} from "@/lib/models/SkillNodeProgress";
import Module from "@/lib/models/Module";
import Badge from "@/lib/models/Badge";
import PlayerBadge from "@/lib/models/PlayerBadge";
import Player from "@/lib/models/Player";
import { LearningError } from "./errors";
import { nodeAppliesToPosition } from "./positions";
import { listPlayerTasks } from "./tasks";

type NodeLean = {
  _id: Types.ObjectId;
  title: string;
  titleEn?: string;
  description?: string;
  moduleId?: Types.ObjectId | null;
  parentId?: Types.ObjectId | null;
  positions?: string[];
  prerequisites?: Types.ObjectId[];
  sequenceOrder?: number;
  lesson?: { videoUrl?: string; diagramUrl?: string; keyPoints?: string[] };
};

async function statusMap(playerId: Types.ObjectId, nodeIds: Types.ObjectId[]) {
  if (nodeIds.length === 0) return new Map<string, ProgressStatus>();
  const rows = await SkillNodeProgress.find({
    playerId,
    nodeId: { $in: nodeIds },
  })
    .select("nodeId status")
    .lean<{ nodeId: Types.ObjectId; status: ProgressStatus }[]>();
  return new Map(rows.map((r) => [String(r.nodeId), r.status]));
}

/**
 * Everything the player's topic page needs. Locked topics return their title and
 * prerequisites only: the lesson and tasks appear once the coach opens it.
 */
export async function getTopicForPlayer(
  nodeId: Types.ObjectId,
  playerId: Types.ObjectId,
) {
  const node = await SkillNode.findById(nodeId).lean<NodeLean>();
  if (!node) throw new LearningError("Topic not found", 404);
  const mod = node.moduleId
    ? await Module.findById(node.moduleId)
        .select("slug title isPublished")
        .lean<{
          _id: Types.ObjectId;
          slug: string;
          title: { ka: string; en?: string };
          isPublished: boolean;
        }>()
    : null;
  if (!mod || !mod.isPublished) throw new LearningError("Topic not found", 404);
  const player = await Player.findById(playerId)
    .select("position")
    .lean<{ position: string }>();
  if (!player) throw new LearningError("Player not found", 404);

  // Breadcrumb: ancestors, outermost first.
  const path: { id: string; title: string }[] = [];
  let parentId = node.parentId ?? null;
  for (let i = 0; parentId && i < 20; i++) {
    const parent: NodeLean | null = await SkillNode.findById(parentId)
      .select("title parentId")
      .lean<NodeLean>();
    if (!parent) break;
    path.unshift({ id: String(parent._id), title: parent.title });
    parentId = parent.parentId ?? null;
  }

  const prerequisiteIds = node.prerequisites ?? [];
  const [prereqNodes, childNodes] = await Promise.all([
    SkillNode.find({ _id: { $in: prerequisiteIds } })
      .select("title titleEn")
      .lean<NodeLean[]>(),
    SkillNode.find({ parentId: nodeId })
      .select("title titleEn positions sequenceOrder")
      .lean<NodeLean[]>(),
  ]);
  const visibleChildren = childNodes
    .filter((c) => nodeAppliesToPosition(c.positions, player.position))
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  const statuses = await statusMap(playerId, [
    nodeId,
    ...prerequisiteIds,
    ...visibleChildren.map((c) => c._id),
  ]);
  const status = statuses.get(String(nodeId)) ?? "LOCKED";
  const locked = status === "LOCKED";

  const tasks = locked
    ? []
    : (await listPlayerTasks(playerId, "all")).filter(
        (t) => t.topic?.id === String(nodeId),
      );

  const badges = await Badge.find({
    skillNodeId: nodeId,
    isArchived: { $ne: true },
    source: { $ne: "MANUAL" },
  })
    .select("title description iconUrl xpReward source")
    .lean<
      {
        _id: Types.ObjectId;
        title: string;
        description: string;
        iconUrl: string | null;
        xpReward: number;
        source: string;
      }[]
    >();
  const earned = new Set(
    (
      await PlayerBadge.find({
        playerId,
        badgeId: { $in: badges.map((b) => b._id) },
      })
        .select("badgeId")
        .lean<{ badgeId: Types.ObjectId }[]>()
    ).map((r) => String(r.badgeId)),
  );

  return {
    topic: {
      id: String(node._id),
      title: node.title,
      titleEn: node.titleEn ?? "",
      description: node.description ?? "",
      forMyPosition: nodeAppliesToPosition(node.positions, player.position),
    },
    module: { id: String(mod._id), slug: mod.slug, title: mod.title },
    path,
    status,
    locked,
    lesson: locked
      ? null
      : {
          videoUrl: node.lesson?.videoUrl ?? "",
          diagramUrl: node.lesson?.diagramUrl ?? "",
          keyPoints: node.lesson?.keyPoints ?? [],
        },
    prerequisites: prereqNodes.map((p) => ({
      id: String(p._id),
      title: p.title,
      titleEn: p.titleEn ?? "",
      status: statuses.get(String(p._id)) ?? "LOCKED",
    })),
    subtopics: visibleChildren.map((c) => ({
      id: String(c._id),
      title: c.title,
      titleEn: c.titleEn ?? "",
      status: statuses.get(String(c._id)) ?? "LOCKED",
    })),
    tasks,
    badges: badges.map((b) => ({
      ...b,
      _id: String(b._id),
      earned: earned.has(String(b._id)),
    })),
  };
}

/** The player opened an Open topic: it becomes In progress. Locked topics stay locked. */
export async function startTopic(
  nodeId: Types.ObjectId,
  playerId: Types.ObjectId,
): Promise<ProgressStatus> {
  await SkillNodeProgress.updateOne(
    { nodeId, playerId, status: "OPEN" },
    { $set: { status: "IN_PROGRESS" } },
  );
  const row = await SkillNodeProgress.findOne({ nodeId, playerId })
    .select("status")
    .lean<{ status: ProgressStatus }>();
  return row?.status ?? "LOCKED";
}
