import mongoose, { Types } from "mongoose";
import SkillNode from "@/lib/models/SkillNode";
import SkillNodeProgress, {
  PROGRESS_STATUSES,
  ProgressStatus,
} from "@/lib/models/SkillNodeProgress";
import Player from "@/lib/models/Player";
import { Audience, resolveAudience } from "./audience";
import { isDuplicateKeyError, isDuplicateOnlyBulkError, LearningError } from "./errors";
import { AwardedBadge, checkBranchBadges } from "./badges";

export interface PrerequisiteWarning {
  playerId: string;
  missing: { nodeId: string; title: string }[];
}

export interface OpenResult {
  opened: number;
  alreadyOpen: number;
  warnings: PrerequisiteWarning[];
}

export function isProgressStatus(value: unknown): value is ProgressStatus {
  return (
    typeof value === "string" &&
    (PROGRESS_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Moves a topic from Locked to Open for these players. Players who are already
 * Open, In progress or Mastered are left alone. Missing prerequisites produce
 * warnings, never a block.
 */
export async function openTopicForPlayers(
  nodeId: Types.ObjectId,
  playerIds: Types.ObjectId[],
  openedBy: Types.ObjectId | null,
): Promise<OpenResult> {
  const node = await SkillNode.findById(nodeId)
    .select("_id prerequisites")
    .lean<{ _id: Types.ObjectId; prerequisites?: Types.ObjectId[] }>();
  if (!node) throw new LearningError("Topic not found", 404);
  if (playerIds.length === 0)
    return { opened: 0, alreadyOpen: 0, warnings: [] };

  const existing = await SkillNodeProgress.find({
    nodeId,
    playerId: { $in: playerIds },
  })
    .select("_id playerId status")
    .lean<
      {
        _id: Types.ObjectId;
        playerId: Types.ObjectId;
        status: ProgressStatus;
      }[]
    >();
  const byPlayer = new Map(existing.map((e) => [String(e.playerId), e]));

  const now = new Date();
  const ops: mongoose.AnyBulkWriteOperation[] = [];
  let alreadyOpen = 0;
  for (const playerId of playerIds) {
    const record = byPlayer.get(String(playerId));
    if (!record) {
      ops.push({
        insertOne: {
          document: {
            nodeId,
            playerId,
            status: "OPEN",
            openedAt: now,
            openedBy,
          },
        },
      });
    } else if (record.status === "LOCKED") {
      ops.push({
        updateOne: {
          filter: { _id: record._id, status: "LOCKED" },
          update: { $set: { status: "OPEN", openedAt: now, openedBy } },
        },
      });
    } else {
      alreadyOpen++;
    }
  }

  let opened = 0;
  if (ops.length > 0) {
    try {
      const res = await SkillNodeProgress.bulkWrite(ops, { ordered: false });
      opened = res.insertedCount + res.modifiedCount;
    } catch (err) {
      // Another request opened some of these at the same moment: that's fine.
      if (!isDuplicateOnlyBulkError(err)) throw err;
      const partial = (
        err as { result?: { insertedCount?: number; modifiedCount?: number } }
      ).result;
      opened = (partial?.insertedCount ?? 0) + (partial?.modifiedCount ?? 0);
    }
  }

  const warnings: PrerequisiteWarning[] = [];
  const prerequisites = node.prerequisites ?? [];
  if (prerequisites.length > 0) {
    const [titles, masteredRows] = await Promise.all([
      SkillNode.find({ _id: { $in: prerequisites } })
        .select("title")
        .lean<{ _id: Types.ObjectId; title: string }[]>(),
      SkillNodeProgress.find({
        playerId: { $in: playerIds },
        nodeId: { $in: prerequisites },
        status: "MASTERED",
      })
        .select("playerId nodeId")
        .lean<{ playerId: Types.ObjectId; nodeId: Types.ObjectId }[]>(),
    ]);
    const titleById = new Map(titles.map((t) => [String(t._id), t.title]));
    const mastered = new Set(
      masteredRows.map((r) => `${r.playerId}:${r.nodeId}`),
    );
    for (const playerId of playerIds) {
      const missing = prerequisites
        .filter((p) => !mastered.has(`${playerId}:${p}`))
        .map((p) => ({
          nodeId: String(p),
          title: titleById.get(String(p)) ?? "Unknown topic",
        }));
      if (missing.length > 0)
        warnings.push({ playerId: String(playerId), missing });
    }
  }

  return { opened, alreadyOpen, warnings };
}

export async function openTopicForAudience(
  nodeId: Types.ObjectId,
  audience: Audience,
  openedBy: Types.ObjectId | null,
): Promise<OpenResult> {
  const recipients = await resolveAudience(audience);
  return openTopicForPlayers(
    nodeId,
    recipients.map((r) => r.playerId),
    openedBy,
  );
}

/** Called on a player's first activity on a topic. Never moves a topic backwards. */
export async function markTopicInProgress(
  playerId: Types.ObjectId,
  nodeId: Types.ObjectId,
): Promise<void> {
  const res = await SkillNodeProgress.updateOne(
    { nodeId, playerId, status: { $in: ["LOCKED", "OPEN"] } },
    { $set: { status: "IN_PROGRESS" } },
  );
  if (res.matchedCount > 0) return;
  if (await SkillNodeProgress.exists({ nodeId, playerId })) return;
  try {
    await SkillNodeProgress.create({
      nodeId,
      playerId,
      status: "IN_PROGRESS",
      openedAt: new Date(),
    });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}

export interface SetStatusResult {
  playerId: string;
  nodeId: string;
  status: ProgressStatus;
  awardedBadges: AwardedBadge[];
}

/**
 * The coach's direct control: sets any status, in any direction. Moving to
 * Mastered checks branch badges. Moving away from Mastered keeps earned badges.
 */
export async function setProgressStatus(
  playerId: Types.ObjectId,
  nodeId: Types.ObjectId,
  status: ProgressStatus,
  coachId: Types.ObjectId | null,
): Promise<SetStatusResult> {
  const [nodeExists, playerExists] = await Promise.all([
    SkillNode.exists({ _id: nodeId }),
    Player.exists({ _id: playerId }),
  ]);
  if (!nodeExists) throw new LearningError("Topic not found", 404);
  if (!playerExists) throw new LearningError("Player not found", 404);

  let record = await SkillNodeProgress.findOne({ nodeId, playerId });
  if (!record) record = new SkillNodeProgress({ nodeId, playerId });

  const previous = record.status;
  const now = new Date();
  record.status = status;
  if (status !== "LOCKED" && !record.openedAt) {
    record.openedAt = now;
    record.openedBy = coachId;
  }
  if (status === "MASTERED") {
    if (previous !== "MASTERED") {
      record.masteredAt = now;
      record.masteredBy = coachId;
    }
  } else {
    record.masteredAt = null;
    record.masteredBy = null;
  }
  await record.save();

  const awardedBadges =
    status === "MASTERED" && previous !== "MASTERED"
      ? await checkBranchBadges(playerId, nodeId)
      : [];

  return {
    playerId: String(playerId),
    nodeId: String(nodeId),
    status,
    awardedBadges,
  };
}
