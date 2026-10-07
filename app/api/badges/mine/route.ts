// Path: app/api/badges/mine/route.ts

import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, toObjectId } from "@/lib/learning/errors";
import { getPlayerBadges } from "@/lib/learning/playerBadges";

/** { earned, goals } for the signed-in player. A coach can preview with ?playerId=…. */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    let playerId: Types.ObjectId | null = viewer.linkedPlayerId;
    const requested = req.nextUrl.searchParams.get("playerId");
    if (viewer.isCoach && requested)
      playerId = toObjectId(requested, "playerId");
    if (!playerId) return forbidden();
    await connectDB();
    return NextResponse.json(await getPlayerBadges(playerId));
  } catch (err) {
    return errorResponse(err, "Failed to load badges");
  }
}
