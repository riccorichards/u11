// Path: lib/learning/badges.ts

import { Types } from "mongoose";
import Badge, { IBadge } from "@/lib/models/Badge";
import PlayerBadge, { AwardSource } from "@/lib/models/PlayerBadge";
import SkillNode from "@/lib/models/SkillNode";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";
import Player from "@/lib/models/Player";
import { awardXp } from "./rewards";
import { LearningError, isDuplicateKeyError } from "./errors";
import { nodeAppliesToPosition } from "./positions";
import type { Lean } from "./types";

export interface AwardOptions {
  awardSource: AwardSource;
  awardedBy?: Types.ObjectId | null;
  taskAssignmentId?: Types.ObjectId | null;
  note?: string;
}

export interface AwardedBadge {
  badgeId: string;
  title: string;
  xpReward: number;
}

/**
 * Gives a badge to a player and adds its XP. Returns null if the player already
 * had it, so calling this twice is always safe.
 */
export async function awardBadge(
  playerId: Types.ObjectId,
  badgeId: Types.ObjectId,
  opts: AwardOptions,
): Promise<AwardedBadge | null> {
  const badge = await Badge.findById(badgeId).lean<Lean<IBadge>>();
  if (!badge) throw new LearningError("Badge not found", 404);
  if (badge.isArchived) throw new LearningError("This badge is archived", 400);

  try {
    await PlayerBadge.create({
      playerId,
      badgeId: badge._id,
      awardSource: opts.awardSource,
      awardedBy: opts.awardedBy ?? null,
      taskAssignmentId: opts.taskAssignmentId ?? null,
      note: opts.note ?? "",
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) return null;
    throw err;
  }

  const xp = badge.xpReward ?? 0;
  await awardXp(playerId, xp);
  return { badgeId: String(badge._id), title: badge.title, xpReward: xp };
}

type TreeRow = {
  _id: Types.ObjectId;
  parentId?: Types.ObjectId | null;
  positions?: string[];
};

export function collectSubtree(
  rootId: string,
  children: Map<string, string[]>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

/**
 * Call after a topic becomes Mastered. Awards every BRANCH badge on that topic or
 * its ancestors whose whole branch (topics for this player's position) is mastered.
 */
export async function checkBranchBadges(
  playerId: Types.ObjectId,
  nodeId: Types.ObjectId,
): Promise<AwardedBadge[]> {
  const node = await SkillNode.findById(nodeId)
    .select("moduleId")
    .lean<{ _id: Types.ObjectId; moduleId?: Types.ObjectId | null }>();
  if (!node) return [];
  const player = await Player.findById(playerId)
    .select("position")
    .lean<{ position: string }>();
  if (!player) return [];

  const nodes = await SkillNode.find({ moduleId: node.moduleId ?? null })
    .select("_id parentId positions")
    .lean<TreeRow[]>();
  const byId = new Map(nodes.map((n) => [String(n._id), n]));
  const children = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n.parentId) continue;
    const key = String(n.parentId);
    children.set(key, [...(children.get(key) ?? []), String(n._id)]);
  }

  // The topic itself plus every ancestor.
  const chain: string[] = [];
  const seen = new Set<string>();
  let current: string | null = String(nodeId);
  while (current && byId.has(current) && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    const parent: Types.ObjectId | null | undefined =
      byId.get(current)!.parentId;
    current = parent ? String(parent) : null;
  }

  const badges = await Badge.find({
    source: "BRANCH",
    isArchived: false,
    skillNodeId: { $in: chain.map((id) => new Types.ObjectId(id)) },
  })
    .select("_id skillNodeId")
    .lean<{ _id: Types.ObjectId; skillNodeId: Types.ObjectId }[]>();
  if (badges.length === 0) return [];

  const masteredRows = await SkillNodeProgress.find({
    playerId,
    status: "MASTERED",
    nodeId: { $in: nodes.map((n) => n._id) },
  })
    .select("nodeId")
    .lean<{ nodeId: Types.ObjectId }[]>();
  const mastered = new Set(masteredRows.map((r) => String(r.nodeId)));

  const awarded: AwardedBadge[] = [];
  for (const badge of badges) {
    const branch = collectSubtree(String(badge.skillNodeId), children).filter(
      (id) => nodeAppliesToPosition(byId.get(id)?.positions, player.position),
    );
    if (branch.length > 0 && branch.every((id) => mastered.has(id))) {
      const result = await awardBadge(playerId, badge._id, {
        awardSource: "AUTO",
      });
      if (result) awarded.push(result);
    }
  }
  return awarded;
}
