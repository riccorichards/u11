// Path: app/api/assignments/[id]/answer/route.ts

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getViewer, unauthorized, forbidden } from "@/lib/learning/guard";
import { errorResponse, readJson, toObjectId } from "@/lib/learning/errors";
import { submitPuzzleAnswer } from "@/lib/learning/tasks";

/** Player answers a puzzle. Body: { optionId } */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const viewer = await getViewer();
  if (!viewer) return unauthorized();
  if (!viewer.linkedPlayerId) return forbidden();
  try {
    const assignmentId = toObjectId(params.id, "assignment id");
    const body = await readJson(req);
    await connectDB();
    return NextResponse.json(
      await submitPuzzleAnswer(
        assignmentId,
        viewer.linkedPlayerId,
        body.optionId,
      ),
    );
  } catch (err) {
    return errorResponse(err, "Failed to submit answer");
  }
}
