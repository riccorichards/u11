// Path: app/api/topics/[id]/start/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, toObjectId } from "@/lib/learning/errors";
import { startTopic } from "@/lib/learning/playerTopics";

/** Player opened the lesson. Moves Open → In progress; returns the current status. */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.linkedPlayerId) return forbidden();
  try {
    const nodeId = toObjectId(params.id, "topic id");
    await connectDB();
    return NextResponse.json({
      status: await startTopic(nodeId, viewer.linkedPlayerId),
    });
  } catch (err) {
    return errorResponse(err, "Failed to start topic");
  }
}
