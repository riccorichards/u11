// Path: app/api/skill-tree/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SkillNode from "@/lib/models/SkillNode";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson } from "@/lib/learning/errors";
import { createNode } from "@/lib/learning/nodes";

/** All topics as flat rows (the builder form needs raw fields like lesson and parentId). */
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    await connectDB();
    const nodes = await SkillNode.find({})
      .sort({ moduleId: 1, sequenceOrder: 1, tierLevel: 1 })
      .lean();
    return NextResponse.json(nodes);
  } catch (err) {
    return errorResponse(err, "Failed to fetch skill tree");
  }
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(await createNode(body), { status: 201 });
  } catch (err) {
    return errorResponse(err, "Failed to create topic");
  }
}
