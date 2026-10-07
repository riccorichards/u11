// Path: app/api/modules/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Module from "@/lib/models/Module";
import SkillNode from "@/lib/models/SkillNode";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
} from "@/lib/learning/errors";

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
    const mod = await Module.findById(id);
    if (!mod) throw new LearningError("Module not found", 404);
    for (const key of [
      "slug",
      "title",
      "description",
      "sequenceOrder",
      "icon",
      "isPublished",
    ] as const) {
      if (key in body) mod.set(key, body[key]);
    }
    await mod.save();
    return NextResponse.json(mod);
  } catch (err) {
    return errorResponse(err, "Failed to update module");
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
    if (await SkillNode.exists({ moduleId: id })) {
      throw new LearningError("Move or delete this module's topics first", 409);
    }
    const res = await Module.deleteOne({ _id: id });
    if (res.deletedCount === 0)
      throw new LearningError("Module not found", 404);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "Failed to delete module");
  }
}
