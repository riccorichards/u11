// Path: app/api/mastery/ready/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, toObjectId } from "@/lib/learning/errors";
import { findReadyForMastery } from "@/lib/learning/mastery";

/** Coach's mastery queue. Optional ?playerId=… or ?nodeId=… */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const q = req.nextUrl.searchParams;
    await connectDB();
    const ready = await findReadyForMastery({
      playerId: q.get("playerId")
        ? toObjectId(q.get("playerId"), "playerId")
        : undefined,
      nodeId: q.get("nodeId")
        ? toObjectId(q.get("nodeId"), "nodeId")
        : undefined,
    });
    return NextResponse.json(ready);
  } catch (err) {
    return errorResponse(err, "Failed to load mastery queue");
  }
}
