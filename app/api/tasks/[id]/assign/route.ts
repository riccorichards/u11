// Path: app/api/tasks/[id]/assign/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  parseOptionalDate,
  readJson,
  toObjectId,
} from "@/lib/learning/errors";
import { parseAudience } from "@/lib/learning/audience";
import { assignTask } from "@/lib/learning/tasks";

/** Body: { audience, dueDate? }. dueDate overrides the task's due date for these players. */
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
    const audience = parseAudience(body.audience);
    const dueDate = parseOptionalDate(body.dueDate, "dueDate");
    await connectDB();
    return NextResponse.json(
      await assignTask(taskId, audience, viewer.userId, dueDate),
    );
  } catch (err) {
    return errorResponse(err, "Failed to assign task");
  }
}
