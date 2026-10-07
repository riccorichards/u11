// Path: app/api/tasks/mine/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  toObjectId,
} from "@/lib/learning/errors";
import { FeedFilter, listPlayerTasks } from "@/lib/learning/tasks";

/**
 * The player's task feed. ?filter=active|done|all (default all).
 * A coach can preview a player's feed with ?playerId=….
 */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    const q = req.nextUrl.searchParams;
    let playerId: Types.ObjectId | null = viewer.linkedPlayerId;
    if (viewer.isCoach && q.get("playerId"))
      playerId = toObjectId(q.get("playerId"), "playerId");
    if (!playerId) return forbidden();

    const filter = (q.get("filter") ?? "all") as FeedFilter;
    if (!["active", "done", "all"].includes(filter)) {
      throw new LearningError("filter must be active, done or all", 400);
    }
    await connectDB();
    return NextResponse.json(await listPlayerTasks(playerId, filter));
  } catch (err) {
    return errorResponse(err, "Failed to fetch tasks");
  }
}
