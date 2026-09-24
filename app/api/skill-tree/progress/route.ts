import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SkillNodeProgress from "@/lib/models/SkillNodeProgress";
import { getSkillTreeProgress } from "@/lib/getSkillTreeProgress";

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get("playerId");
  if (!playerId)
    return NextResponse.json({ error: "playerId required" }, { status: 400 });
  const map = await getSkillTreeProgress(playerId);
  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json(); // { playerId, nodeId, status }
    await connectDB();
    const record = await SkillNodeProgress.findOneAndUpdate(
      { playerId: body.playerId, nodeId: body.nodeId },
      { status: body.status },
      { new: true, upsert: true },
    );
    return NextResponse.json(record);
  } catch {
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 },
    );
  }
}
