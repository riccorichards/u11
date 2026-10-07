// Path: app/api/groups/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PlayerGroup from "@/lib/models/PlayerGroup";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
  toObjectIds,
} from "@/lib/learning/errors";
import { assertPlayersExist } from "@/lib/learning/audience";

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
    const group = await PlayerGroup.findById(id);
    if (!group) throw new LearningError("Group not found", 404);

    for (const key of ["name", "description", "color", "isArchived"] as const) {
      if (key in body) group.set(key, body[key]);
    }
    if ("playerIds" in body) {
      const playerIds = toObjectIds(body.playerIds, "playerIds");
      await assertPlayersExist(playerIds);
      group.playerIds = playerIds;
    }
    await group.save();
    return NextResponse.json(group);
  } catch (err) {
    return errorResponse(err, "Failed to update group");
  }
}

/** Archives rather than deletes, so past assignments keep pointing at a real group. */
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
    const res = await PlayerGroup.updateOne(
      { _id: id },
      { $set: { isArchived: true } },
    );
    if (res.matchedCount === 0) throw new LearningError("Group not found", 404);
    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err, "Failed to archive group");
  }
}
