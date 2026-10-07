// Path: app/api/tasks/[id]/assignments/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, toObjectId } from "@/lib/learning/errors";
import { listTaskAssignments } from "@/lib/learning/tasks";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const taskId = toObjectId(params.id, "task id");
    await connectDB();
    return NextResponse.json(await listTaskAssignments(taskId));
  } catch (err) {
    return errorResponse(err, "Failed to fetch assignments");
  }
}
