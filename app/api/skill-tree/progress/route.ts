// Path: app/api/skill-tree/progress/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
} from "@/lib/learning/errors";
import { isProgressStatus, setProgressStatus } from "@/lib/learning/progress";

/** ?playerId=… → [{ nodeId, status, masteredAt }]. Players can only read their own. */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    const requested = req.nextUrl.searchParams.get("playerId");
    let playerId: Types.ObjectId | null = viewer.linkedPlayerId;
    if (viewer.isCoach) {
      if (!requested) throw new LearningError("playerId is required", 400);
      playerId = toObjectId(requested, "playerId");
    }
    if (!playerId) return forbidden();
    await connectDB();
    const rows = await SkillNodeProgress.find({ playerId })
      .select("nodeId status masteredAt openedAt")
      .lean();
    return NextResponse.json(rows);
  } catch (err) {
    return errorResponse(err, "Failed to fetch progress");
  }
}

/** Coach sets a status directly. Body: { playerId, nodeId, status }. Mastered triggers branch badges. */
export async function PATCH(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    if (!isProgressStatus(body.status))
      throw new LearningError("Invalid status", 400);
    await connectDB();
    const result = await setProgressStatus(
      toObjectId(body.playerId, "playerId"),
      toObjectId(body.nodeId, "nodeId"),
      body.status,
      viewer.userId,
    );
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, "Failed to update progress");
  }
}
