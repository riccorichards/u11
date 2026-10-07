import { PipelineStage, Types } from "mongoose";
import TaskAssignment from "@/lib/models/TaskAssignment";
import Task from "@/lib/models/Task";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";
import SkillNode from "@/lib/models/SkillNode";
import Player from "@/lib/models/Player";
import { setProgressStatus, SetStatusResult } from "./progress";
import { LearningError, toObjectId } from "./errors";

export interface ReadyForMastery {
  playerId: Types.ObjectId;
  nodeId: Types.ObjectId;
  tasksPassed: number;
  lastPassedAt: Date | null;
  player: { name: string; surname: string; number: number; position: string };
  topic: { title: string; titleEn?: string; moduleId?: Types.ObjectId | null };
}

/**
 * Players who have passed every (non-archived) task on a topic they haven't
 * mastered yet. Computed on read, so it can never drift out of sync.
 */
export async function findReadyForMastery(
  filter: { playerId?: Types.ObjectId; nodeId?: Types.ObjectId } = {},
): Promise<ReadyForMastery[]> {
  const pipeline: PipelineStage[] = [
    { $match: filter.playerId ? { playerId: filter.playerId } : {} },
    {
      $lookup: {
        from: Task.collection.name,
        localField: "taskId",
        foreignField: "_id",
        as: "task",
      },
    },
    { $unwind: "$task" },
    {
      $match: {
        "task.isArchived": { $ne: true },
        ...(filter.nodeId ? { "task.skillNodeId": filter.nodeId } : {}),
      },
    },
    {
      $group: {
        _id: { playerId: "$playerId", nodeId: "$task.skillNodeId" },
        total: { $sum: 1 },
        passed: { $sum: { $cond: [{ $eq: ["$status", "PASSED"] }, 1, 0] } },
        lastPassedAt: { $max: "$completedAt" },
      },
    },
    { $match: { $expr: { $eq: ["$total", "$passed"] } } },
    {
      $lookup: {
        from: SkillNodeProgress.collection.name,
        let: { p: "$_id.playerId", n: "$_id.nodeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$playerId", "$$p"] },
                  { $eq: ["$nodeId", "$$n"] },
                ],
              },
            },
          },
          { $project: { status: 1 } },
        ],
        as: "progress",
      },
    },
    { $match: { "progress.status": { $ne: "MASTERED" } } },
    {
      $lookup: {
        from: Player.collection.name,
        localField: "_id.playerId",
        foreignField: "_id",
        as: "player",
      },
    },
    { $unwind: "$player" },
    {
      $lookup: {
        from: SkillNode.collection.name,
        localField: "_id.nodeId",
        foreignField: "_id",
        as: "node",
      },
    },
    { $unwind: "$node" },
    { $sort: { lastPassedAt: -1 } },
    {
      $project: {
        _id: 0,
        playerId: "$_id.playerId",
        nodeId: "$_id.nodeId",
        tasksPassed: "$passed",
        lastPassedAt: 1,
        player: {
          name: "$player.name",
          surname: "$player.surname",
          number: "$player.number",
          position: "$player.position",
        },
        topic: {
          title: "$node.title",
          titleEn: "$node.titleEn",
          moduleId: "$node.moduleId",
        },
      },
    },
  ];
  return TaskAssignment.aggregate<ReadyForMastery>(pipeline);
}

/** Coach confirms one or more players as Mastered. Each item succeeds or fails on its own. */
export async function confirmMastery(
  items: unknown,
  coachId: Types.ObjectId | null,
) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new LearningError("items must be a non-empty array", 400);
  }
  if (items.length > 100)
    throw new LearningError("Confirm at most 100 at a time", 400);

  const results: (
    | SetStatusResult
    | { playerId: string; nodeId: string; error: string }
  )[] = [];
  for (const raw of items) {
    const item = (raw ?? {}) as Record<string, unknown>;
    try {
      const playerId = toObjectId(item.playerId, "playerId");
      const nodeId = toObjectId(item.nodeId, "nodeId");
      results.push(
        await setProgressStatus(playerId, nodeId, "MASTERED", coachId),
      );
    } catch (err) {
      if (!(err instanceof LearningError)) throw err;
      results.push({
        playerId: String(item.playerId),
        nodeId: String(item.nodeId),
        error: err.message,
      });
    }
  }
  return { results };
}
