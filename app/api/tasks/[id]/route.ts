// Path: app/api/tasks/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/lib/models/Task";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
} from "@/lib/learning/errors";
import { archiveTask, updateTask } from "@/lib/learning/tasks";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id);
    await connectDB();
    const task = await Task.findById(id).lean();
    if (!task) throw new LearningError("Task not found", 404);
    return NextResponse.json(task);
  } catch (err) {
    return errorResponse(err, "Failed to fetch task");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id);
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(await updateTask(id, body));
  } catch (err) {
    return errorResponse(err, "Failed to update task");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id);
    await connectDB();
    await archiveTask(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "Failed to archive task");
  }
}
