// Path: app/api/topics/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, toObjectId } from "@/lib/learning/errors";
import { getTopicForPlayer } from "@/lib/learning/playerTopics";

/** The player's topic page. A coach can preview it with ?playerId=…. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    const nodeId = toObjectId(params.id, "topic id");
    let playerId: Types.ObjectId | null = viewer.linkedPlayerId;
    const requested = req.nextUrl.searchParams.get("playerId");
    if (viewer.isCoach && requested)
      playerId = toObjectId(requested, "playerId");
    if (!playerId) return forbidden();
    await connectDB();
    return NextResponse.json(await getTopicForPlayer(nodeId, playerId));
  } catch (err) {
    return errorResponse(err, "Failed to load topic");
  }
}
