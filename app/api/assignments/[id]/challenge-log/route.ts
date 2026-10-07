// Path: app/api/assignments/[id]/challenge-log/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectId } from "@/lib/learning/errors";
import { logChallengeAttempt } from "@/lib/learning/tasks";

/** Coach logs one challenge attempt. Body: { success: boolean, note? } */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const assignmentId = toObjectId(params.id, "assignment id");
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(await logChallengeAttempt(assignmentId, body));
  } catch (err) {
    return errorResponse(err, "Failed to log attempt");
  }
}
