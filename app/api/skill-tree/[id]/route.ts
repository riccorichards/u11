// Path: app/api/skill-tree/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectId } from "@/lib/learning/errors";
import { deleteNode, updateNode } from "@/lib/learning/nodes";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const id = toObjectId(params.id, "topic id");
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(await updateNode(id, body));
  } catch (err) {
    return errorResponse(err, "Failed to update topic");
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
    const id = toObjectId(params.id, "topic id");
    await connectDB();
    await deleteNode(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "Failed to delete topic");
  }
}
