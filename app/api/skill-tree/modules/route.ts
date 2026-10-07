// Path: app/api/skill-tree/modules/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import Module from "@/lib/models/Module";
import SkillNode from "@/lib/models/SkillNode";
import SkillNodeProgress, {
  ProgressStatus,
} from "@/lib/models/SkillNodeProgress";
import Player from "@/lib/models/Player";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  toObjectId,
} from "@/lib/learning/errors";
import { isPlayerPosition } from "@/lib/learning/positions";
import { buildModuleTrees, ModuleRow, NodeRow } from "@/lib/learning/skillTree";

/**
 * Players: their own Brain (published modules, their position, their progress).
 * Coach: ?playerId=… to see a player's Brain, ?position=… to filter,
 *        ?includeUnpublished=true, ?includeUnassigned=true for the builder.
 */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    const q = req.nextUrl.searchParams;
    await connectDB();

    let playerId: Types.ObjectId | null = null;
    let position: string | null = null;
    let includeUnpublished = false;
    let includeUnassigned = false;

    if (viewer.isCoach) {
      if (q.get("playerId"))
        playerId = toObjectId(q.get("playerId"), "playerId");
      const pos = q.get("position");
      if (pos && pos !== "ALL") {
        if (!isPlayerPosition(pos))
          throw new LearningError("position must be GK, DEF, MID or FWD", 400);
        position = pos;
      }
      includeUnpublished = q.get("includeUnpublished") === "true";
      includeUnassigned = q.get("includeUnassigned") === "true";
    } else {
      if (!viewer.linkedPlayerId) return forbidden();
      playerId = viewer.linkedPlayerId;
    }

    if (playerId) {
      const player = await Player.findById(playerId)
        .select("position")
        .lean<{ position: string }>();
      if (!player) throw new LearningError("Player not found", 404);
      if (!position && (!viewer.isCoach || !q.get("position")))
        position = player.position;
    }

    const modules = await Module.find(
      includeUnpublished ? {} : { isPublished: true },
    )
      .sort({ sequenceOrder: 1 })
      .lean<ModuleRow[]>();
    const moduleIds = modules.map((m) => m._id);
    const nodes = await SkillNode.find(
      includeUnassigned
        ? { $or: [{ moduleId: { $in: moduleIds } }, { moduleId: null }] }
        : { moduleId: { $in: moduleIds } },
    ).lean<NodeRow[]>();

    let progress: Map<string, ProgressStatus> | undefined;
    if (playerId) {
      const rows = await SkillNodeProgress.find({
        playerId,
        nodeId: { $in: nodes.map((n) => n._id) },
      })
        .select("nodeId status")
        .lean<{ nodeId: Types.ObjectId; status: ProgressStatus }[]>();
      progress = new Map(rows.map((r) => [String(r.nodeId), r.status]));
    }

    const trees = buildModuleTrees(modules, nodes, {
      position,
      progress,
      includeEmptyModules: viewer.isCoach,
    });
    return NextResponse.json({
      position,
      playerId: playerId ? String(playerId) : null,
      trees,
    });
  } catch (err) {
    return errorResponse(err, "Failed to build skill tree");
  }
}
