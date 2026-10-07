// Path: app/api/modules/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Module from "@/lib/models/Module";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson } from "@/lib/learning/errors";

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  try {
    await connectDB();
    const modules = await Module.find(
      viewer.isCoach ? {} : { isPublished: true },
    )
      .sort({ sequenceOrder: 1 })
      .lean();
    return NextResponse.json(modules);
  } catch (err) {
    return errorResponse(err, "Failed to fetch modules");
  }
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    await connectDB();
    let sequenceOrder = body.sequenceOrder;
    if (sequenceOrder === undefined) {
      const last = await Module.findOne()
        .sort({ sequenceOrder: -1 })
        .select("sequenceOrder")
        .lean<{ sequenceOrder: number }>();
      sequenceOrder = (last?.sequenceOrder ?? -1) + 1;
    }
    const mod = await Module.create({
      slug: body.slug,
      title: body.title,
      description: body.description ?? {},
      sequenceOrder,
      icon: body.icon ?? "",
      isPublished: Boolean(body.isPublished),
    });
    return NextResponse.json(mod, { status: 201 });
  } catch (err) {
    return errorResponse(err, "Failed to create module");
  }
}
