// Path: app/api/badges/[id]/award/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import {
  errorResponse,
  LearningError,
  readJson,
  toObjectId,
  toObjectIds,
} from "@/lib/learning/errors";
import { assertPlayersExist } from "@/lib/learning/audience";
import { awardBadge } from "@/lib/learning/badges";

/** Coach awards a badge by hand. Body: { playerIds: [...], note? } */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.isCoach) return forbidden();
  try {
    const badgeId = toObjectId(params.id, "badge id");
    const body = await readJson(req);
    const playerIds = toObjectIds(body.playerIds, "playerIds");
    if (playerIds.length === 0)
      throw new LearningError("Pick at least one player", 400);
    const note = typeof body.note === "string" ? body.note : "";
    await connectDB();
    await assertPlayersExist(playerIds);

    const awarded: string[] = [];
    const alreadyHad: string[] = [];
    for (const playerId of playerIds) {
      const result = await awardBadge(playerId, badgeId, {
        awardSource: "COACH",
        awardedBy: viewer.userId,
        note,
      });
      (result ? awarded : alreadyHad).push(String(playerId));
    }
    return NextResponse.json({ awarded, alreadyHad });
  } catch (err) {
    return errorResponse(err, "Failed to award badge");
  }
}
