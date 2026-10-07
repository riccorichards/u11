// Path: app/api/mastery/confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson } from "@/lib/learning/errors";
import { confirmMastery } from "@/lib/learning/mastery";

/** Body: { items: [{ playerId, nodeId }] } */
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(await confirmMastery(body.items, viewer.userId));
  } catch (err) {
    return errorResponse(err, "Failed to confirm mastery");
  }
}
