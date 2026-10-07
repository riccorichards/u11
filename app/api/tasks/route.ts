// Path: app/api/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectId } from "@/lib/learning/errors";
import { createTask, listTasks } from "@/lib/learning/tasks";

/** Coach list. Filters: ?skillNodeId=…&type=PUZZLE&includeArchived=true */
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const q = req.nextUrl.searchParams;
    await connectDB();
    const tasks = await listTasks({
      skillNodeId: q.get("skillNodeId")
        ? toObjectId(q.get("skillNodeId"), "skillNodeId")
        : undefined,
      type: q.get("type") ?? undefined,
      includeArchived: q.get("includeArchived") === "true",
    });
    return NextResponse.json(tasks);
  } catch (err) {
    return errorResponse(err, "Failed to fetch tasks");
  }
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(await createTask(body, viewer.userId), {
      status: 201,
    });
  } catch (err) {
    return errorResponse(err, "Failed to create task");
  }
}
