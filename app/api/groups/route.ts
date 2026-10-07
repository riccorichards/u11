// Path: app/api/groups/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerGroup from "@/lib/models/PlayerGroup";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectIds } from "@/lib/learning/errors";
import { assertPlayersExist } from "@/lib/learning/audience";

export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    await connectDB();
    const includeArchived =
      req.nextUrl.searchParams.get("includeArchived") === "true";
    const groups = await PlayerGroup.find(
      includeArchived ? {} : { isArchived: false },
    )
      .sort({ name: 1 })
      .populate("playerIds", "name surname number position")
      .lean();
    return NextResponse.json(groups);
  } catch (err) {
    return errorResponse(err, "Failed to fetch groups");
  }
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const body = await readJson(req);
    await connectDB();
    const playerIds = toObjectIds(body.playerIds ?? [], "playerIds");
    await assertPlayersExist(playerIds);
    const group = await PlayerGroup.create({
      name: body.name,
      description: body.description ?? "",
      color: body.color ?? undefined,
      playerIds,
      createdBy: viewer.userId,
    });
    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    return errorResponse(err, "Failed to create group");
  }
}
