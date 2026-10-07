// Path: app/api/skill-tree/[id]/open/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectId } from "@/lib/learning/errors";
import { parseAudience } from "@/lib/learning/audience";
import { openTopicForAudience } from "@/lib/learning/progress";

/** Body: { audience }. Returns { opened, alreadyOpen, warnings }. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const nodeId = toObjectId(params.id, "topic id");
    const body = await readJson(req);
    const audience = parseAudience(body.audience);
    await connectDB();
    return NextResponse.json(
      await openTopicForAudience(nodeId, audience, viewer.userId),
    );
  } catch (err) {
    return errorResponse(err, "Failed to open topic");
  }
}
