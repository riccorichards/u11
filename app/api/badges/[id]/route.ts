// Path: app/api/badges/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Badge from "@/lib/models/Badge";
import PlayerBadge from "@/lib/models/PlayerBadge";
import SkillNode from "@/lib/models/SkillNode";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
} from "@/lib/learning/errors";

/** The badge plus everyone who has it. */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id, "badge id");
    await connectDB();
    const badge = await Badge.findById(id).lean();
    if (!badge) throw new LearningError("Badge not found", 404);
    const holders = await PlayerBadge.find({ badgeId: id })
      .populate("playerId", "name surname number position")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ badge, holders });
  } catch (err) {
    return errorResponse(err, "Failed to fetch badge");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id, "badge id");
    const body = await readJson(req);
    await connectDB();
    const badge = await Badge.findById(id);
    if (!badge) throw new LearningError("Badge not found", 404);
    for (const key of [
      "title",
      "description",
      "category",
      "xpReward",
      "source",
      "isArchived",
    ] as const) {
      if (key in body) badge.set(key, body[key]);
    }
    if ("iconUrl" in body) badge.iconUrl = (body.iconUrl as string) || null;
    if ("skillNodeId" in body) {
      if (!body.skillNodeId) {
        badge.skillNodeId = null;
      } else {
        const nodeId = toObjectId(body.skillNodeId, "skillNodeId");
        if (!(await SkillNode.exists({ _id: nodeId })))
          throw new LearningError("Topic not found", 404);
        badge.skillNodeId = nodeId;
      }
    }
    await badge.save();
    return NextResponse.json(badge);
  } catch (err) {
    return errorResponse(err, "Failed to update badge");
  }
}

/** Archives: players keep badges they've earned, but nobody can earn it anymore. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id, "badge id");
    await connectDB();
    const res = await Badge.updateOne(
      { _id: id },
      { $set: { isArchived: true } },
    );
    if (res.matchedCount === 0) throw new LearningError("Badge not found", 404);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "Failed to archive badge");
  }
}
