// Path: app/api/tasks/[id]/field-check/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectId } from "@/lib/learning/errors";
import { gradeFieldCheck } from "@/lib/learning/tasks";

/** Body: { grades: [{ playerId, result: "PASSED" | "NOT_YET", note? }] } */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const taskId = toObjectId(params.id, "task id");
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(
      await gradeFieldCheck(taskId, body.grades, viewer.userId),
    );
  } catch (err) {
    return errorResponse(err, "Failed to save grades");
  }
}
