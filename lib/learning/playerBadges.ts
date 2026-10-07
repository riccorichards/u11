// Path: lib/learning/playerBadges.ts

import { Types } from "mongoose";
import Badge from "@/lib/models/Badge";
import PlayerBadge from "@/lib/models/PlayerBadge";
import SkillNode from "@/lib/models/SkillNode";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";
import Module from "@/lib/models/Module";
import Player from "@/lib/models/Player";
import Task from "@/lib/models/Task";
import TaskAssignment from "@/lib/models/TaskAssignment";
import { collectSubtree } from "./badges";
import { LearningError } from "./errors";
import { nodeAppliesToPosition } from "./positions";

type BadgeLean = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  iconUrl: string | null;
  xpReward: number;
  source: "TASK" | "BRANCH" | "MANUAL";
  category: string;
  skillNodeId?: Types.ObjectId | null;
};

/**
 * Earned badges, plus goals the player can still earn:
 * branch badges in published modules (with progress) and badges on their open tasks.
 * Coach-only badges stay hidden until given, so they remain a surprise.
 */
export async function getPlayerBadges(playerId: Types.ObjectId) {
  const player = await Player.findById(playerId)
    .select("position")
    .lean<{ position: string }>();
  if (!player) throw new LearningError("Player not found", 404);

  const earnedRows = await PlayerBadge.find({ playerId })
    .sort({ createdAt: -1 })
    .lean<
      {
        badgeId: Types.ObjectId;
        awardSource: string;
        note: string;
        createdAt: Date;
      }[]
    >();
  const earnedIds = earnedRows.map((r) => r.badgeId);
  const earnedBadges = await Badge.find({ _id: { $in: earnedIds } }).lean<
    BadgeLean[]
  >();
  const badgeById = new Map(earnedBadges.map((b) => [String(b._id), b]));
  const earned = earnedRows.flatMap((r) => {
    const b = badgeById.get(String(r.badgeId));
    return b
      ? [
          {
            ...b,
            _id: String(b._id),
            skillNodeId: b.skillNodeId ? String(b.skillNodeId) : null,
            earnedAt: r.createdAt,
            awardSource: r.awardSource,
            note: r.note,
          },
        ]
      : [];
  });
  const earnedSet = new Set(earnedIds.map(String));

  // Branch goals
  const publishedModules = await Module.find({ isPublished: true })
    .select("_id")
    .lean<{ _id: Types.ObjectId }[]>();
  const nodes = await SkillNode.find({
    moduleId: { $in: publishedModules.map((m) => m._id) },
  })
    .select("_id title parentId positions")
    .lean<
      {
        _id: Types.ObjectId;
        title: string;
        parentId?: Types.ObjectId | null;
        positions?: string[];
      }[]
    >();
  const byId = new Map(nodes.map((n) => [String(n._id), n]));
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const k = String(n.parentId);
    children.set(k, [...(children.get(k) ?? []), String(n._id)]);
  }
  const mastered = new Set(
    (
      await SkillNodeProgress.find({ playerId, status: "MASTERED" })
        .select("nodeId")
        .lean<{ nodeId: Types.ObjectId }[]>()
    ).map((r) => String(r.nodeId)),
  );

  const branchBadges = await Badge.find({
    source: "BRANCH",
    isArchived: { $ne: true },
    _id: { $nin: earnedIds },
  }).lean<BadgeLean[]>();

  const branchGoals = branchBadges.flatMap((b) => {
    const rootId = b.skillNodeId ? String(b.skillNodeId) : null;
    if (!rootId || !byId.has(rootId)) return [];
    const branch = collectSubtree(rootId, children).filter((id) =>
      nodeAppliesToPosition(byId.get(id)?.positions, player.position),
    );
    if (branch.length === 0) return [];
    return [
      {
        ...b,
        _id: String(b._id),
        skillNodeId: rootId,
        kind: "BRANCH" as const,
        how: { topicId: rootId, topicTitle: byId.get(rootId)!.title },
        progress: {
          done: branch.filter((id) => mastered.has(id)).length,
          total: branch.length,
        },
      },
    ];
  });

  // Task goals: badges on tasks the player is still working on.
  const active = await TaskAssignment.find({
    playerId,
    status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
  })
    .select("taskId")
    .lean<{ taskId: Types.ObjectId }[]>();
  const tasks = await Task.find({
    _id: { $in: active.map((a) => a.taskId) },
    isArchived: false,
    badgeId: { $ne: null },
  })
    .select("title badgeId skillNodeId")
    .lean<
      {
        _id: Types.ObjectId;
        title: string;
        badgeId: Types.ObjectId;
        skillNodeId: Types.ObjectId;
      }[]
    >();
  const taskBadgeIds = tasks
    .map((t) => t.badgeId)
    .filter((id) => !earnedSet.has(String(id)));
  const taskBadges = await Badge.find({
    _id: { $in: taskBadgeIds },
    isArchived: { $ne: true },
  }).lean<BadgeLean[]>();
  const taskBadgeById = new Map(taskBadges.map((b) => [String(b._id), b]));
  const seen = new Set<string>();
  const taskGoals = tasks.flatMap((t) => {
    const b = taskBadgeById.get(String(t.badgeId));
    if (!b || seen.has(String(b._id))) return [];
    seen.add(String(b._id));
    return [
      {
        ...b,
        _id: String(b._id),
        skillNodeId: String(t.skillNodeId),
        kind: "TASK" as const,
        how: {
          taskId: String(t._id),
          taskTitle: t.title,
          topicId: String(t.skillNodeId),
        },
        progress: null,
      },
    ];
  });

  return { earned, goals: [...taskGoals, ...branchGoals] };
}
